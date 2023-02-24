<template>
  <div class="container">
    <section class="row">
      <div class="col-12">
        <nav class="navbar navbar-light bg-light">
          <div class="container-fluid">
            <span class="navbar-brand">Эмулятор заказа</span>
            <Switches v-model="enabled" :label="label" />
          </div>
        </nav>
      </div>
    </section>

    <InputComponent @onChange="onChange" @onInput="onInput" @send="send" />

    <!-- start: можно еще декомпозировать код на два компонента, но для примера вполне достаточно -->
    <section class="row my-3">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            Состояние хранилища
          </div>

          <div class="card-body">
            <code class="storage__view" v-html="representation" />
          </div>
        </div>
      </div>
    </section>

    <section class="row my-3">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            События
          </div>

          <ul class="list-group list-group-flush">
            <template v-for="(evt, i) in events">
              <li @click="expand" class="list-group-item list-group-item-action dropdown" :key="i">
                <em v-if="evt.extend" class="bi bi-caret-down-fill"></em> {{ evt.desc }}
                <div
                  v-if="evt.extend"
                  class="dropdown-menu"
                  data-collapsed="true"
                  v-html="evt.extend"
                />
              </li>
            </template>
          </ul>
        </div>
      </div>
    </section>
    <!-- end -->
  </div>
</template>

<script>
import InputComponent from '@/components/InputComponent'
import { sendRequest, stringify, debounce } from '@/utils/common'
import { Archiver } from '@/utils/archiver'

import { mapMutations } from 'vuex'
import Switches from 'vue-switches'

export default {
  name: 'OrderRegistrationComponent',

  components: {
    InputComponent,
    Switches
  },
  data: () => ({
    archiver: Archiver.init(),
    label: 'По первому полю',

    correction: false,
    byFirst: true,

    validators: [],
    events: []
  }),
  computed: {
    representation()
    {
      return `<pre>${stringify(this.storage)}</pre>`
    },
    enabled: {
      set(v) {
        this.label = v ? 'Первое измененное' : 'Последнее измененное'
        this.byFirst = v
      },
      get() {
        return this.byFirst
      }
    },
    nonce: {
      set(nonce) {
        this.$store.commit('setNonce', { nonce })
      },
      get() {
        return this.$store.getters.nonce
      }
    },
    amount: {
      set(amount) {
        this.$store.commit('setAmount', { amount })
      },
      get() {
        return this.$store.getters.amount
      }
    },
    price: {
      set(price) {
        this.$store.commit('setPrice', { price })
      },
      get() {
        return this.$store.getters.price
      }
    },
    qty: {
      set(qty) {
        this.$store.commit('setQty', { qty })
      },
      get() {
        return this.$store.getters.qty
      }
    },
    order: {
      set(order) {
        this.$store.commit('setOrder', order)
      },
      get() {
        return this.$store.state.order
      }
    },
    storage()
    {
      return this.$store.state.storage
    }
  },
  watch: {
    order: {
      deep: true,
      handler()
      {
        if (this.correction || !this.archiver.lastChanged) return

        this.correction = true

        const first = this.archiver.firstChanged
        const last = this.archiver.lastChanged
        const now = this.archiver.nowChange

        const field = this.byFirst ? first : last

        this.$store.commit('setOrderByKey', {
          key: field,

          value: (value => {
            const amount = this.price * this.qty

            switch (now) {
              case 'amount':
                switch (field) {
                  case 'qty':
                    this.price && (value = this.amount / this.price)
                    break
                  case 'price':
                    this.qty && (value = this.amount / this.qty)
                    break
                }
                break
              case 'price':
                if (!this.order.amount) {
                  this.amount = amount
                }

                switch (field) {
                  case 'qty':
                    this.amount && (value = this.amount / this.price)
                    break
                  case 'amount':
                    this.qty && (value = this.price * this.qty)
                    break
                }
                break
              case 'qty':
                if (!this.order.amount) {
                  this.amount = amount
                }

                switch (field) {
                  case 'price':
                    this.amount && (value = this.amount / this.qty)
                    break
                  case 'amount':
                    this.price && (value = this.qty * this.price)
                    break
                }
            }

            if (value >= Infinity) {
              value = 0
            }

            return value

          })(this[field])
        })

        this.correction = false
      }
    }
  },
  methods: {
    ...mapMutations(['setStorage']),

    expand({ target })
    {
      target.closest('.dropdown').lastElementChild?.classList.toggle('dropdown-menu--expanded')
    },
    beforeSend()
    {
      this.onChange({
        key: 'submit',
        action: 'отправка на сервер',
        extend: `
          <pre>send: ${stringify(this.order)}</pre><br>
          <pre>local: ${stringify(this.storage)}</pre>
        `
      })
    },
    afterSend(success)
    {
      this.onChange({
        key: 'response',
        action: 'ответ сервера',
        extend: `
          <pre>response: ${JSON.stringify({ success }, null, 2)}</pre><br>
          <pre>local: ${stringify(this.storage)}</pre>
        `
      })
    },
    async send()
    {
      this.beforeSend()

      const { success } = await sendRequest(stringify(this.order))

      if (success) {
        window.localStorage.setItem('order', stringify(this.order))
        this.setStorage(Object.assign({}, this.order))
      }

      this.afterSend(success)
    },
    onChange: debounce(function({ target, key, extend, action = 'было изменено' }) {
      this.$store.commit('setNonce', { nonce: this.nonce + 1 })

      this.events.unshift({
        key, desc: `${this.nonce} ${key} ${action} ${target?.value || ''}`, extend
      })
    }),
    onInput: debounce(function({ target, key }) {
      this.$store.commit('setOrderByKey', { key, value: +target.value })
      this.archiver.nowChange = key
    })
  },
  beforeMount()
  {
    if (!window.localStorage.getItem('order')) {
      window.localStorage.setItem('order', stringify(this.order))
    }

    this.setStorage(
      JSON.parse(
        window.localStorage.getItem('order')
      )
    )
  }
}
</script>

<style lang="scss">
.container .row {
  justify-content: space-around;
  align-items: center;

  ::v-deep(pre) {
    margin: 0;
  }

  label {
    display: block;
  }
  sub {
    display: block;
    margin-left: 10px;

    line-height: unset;
    font-size: .5em;
    color: #6c757d;

    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .vue-switcher {
    display: flex;
    width: 220px;
    justify-content: flex-end;
    align-items: center;

    .vue-switcher__label {
      margin: 0 10px 2px 0;
      font-size: .9em;
      display: block;
    }
  }
  .bi-caret-down-fill {
    font-size: 10px;
    margin: 0 10px;
  }
  .col-3 {
    width: 130px;
    margin: 5px auto;
    font-size: 20px;
    flex-grow: 1;
    flex-shrink: 0;
    order: 0;

    &:last-child {
      flex-grow: 0;
      flex-shrink: 1;
      align-self: flex-start;
    }
  }
  .card {
    .list-group {
      max-height: 490px;
      min-height: 204px;
      overflow: scroll;

      .list-group-item-action {
        cursor: pointer;
      }
    }
  }
  .dropdown-menu {
    position: relative;
    display: block;
    border: none;

    overflow: hidden;

    padding: 0 5px 0 35px;
    max-height: 0;

    background: transparent;

    &--expanded {
      padding: 10px 5px 10px 35px;
      max-height: fit-content;
    }
  }
}
</style>
