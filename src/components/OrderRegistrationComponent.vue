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

    <!-- start: можно еще декомпозировать код на два компонента -->
    <!-- 1 --><section class="row my-3">
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

    <!-- 2 --><section class="row my-3">
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
import { sendRequest, cutSpaces, stringify, debounce } from '@/utils/common'
import { Archiver } from '@/utils/archiver'

import InputComponent from '@/components/InputComponent'
import Switches from 'vue-switches'
import { mapMutations } from 'vuex'

export default {
  name: 'OrderRegistrationComponent',

  components: {
    InputComponent,
    Switches
  },
  data: () => ({
    archiver: Archiver.init(),
    label: 'Первое измененное',

    correction: false,
    byFirst: true,

    validators: [],
    events: [],

    buffer: {
      amount: 0,
      nonce: 0,
      price: 0,
      qty: 0
    }
  }),
  computed: {
    representation()
    {
      return `<pre>${this.storage}</pre>`
    },
    storage()
    {
      return this.$store.state.storage
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
    }
  },
  methods: {
    ...mapMutations(['setStorage']),

    expand({ target })
    {
      target.closest('.dropdown').lastElementChild?.classList.toggle('dropdown-menu--expanded')
    },
    beforeSend(key = 'submit')
    {
      this.onChange({
        action: '(отправка на сервер)',
        extend: `
          <pre>send: ${stringify(this.order)}</pre><br>
          <pre>local: ${this.storage}</pre>
        `,
        key
      })
    },
    afterSend(success, key = 'response')
    {
      this.onChange({
        action: '(ответ сервера)',
        extend: `
          <pre>response: ${JSON.stringify({ success }, null, 2)}</pre><br>
          <pre>local: ${this.storage}</pre>
        `,
        key
      })
    },
    async send()
    {
      this.beforeSend()

      const { success } = await sendRequest(this.order)

      if (success) {
        localStorage.setItem('order', stringify(this.order))
        this.setStorage(stringify(this.order))
      }

      this.afterSend(success)
    },
    onChange: debounce(function({ extend, key = '', action = 'было изменено' }) {
      let old, now, str = '', nonce = this.order.nonce += 1

      if (!['submit','response'].includes(key)) {
        old = this[key]
        this.flush(this.buffer[key])
        now = this[key]
      }

      str += old ? `${old} >>> ` : ''
      str += now ? `${now}` : ''

      this.events.unshift({
        desc: cutSpaces(`${nonce} ${key} ${action} ${str}`),
        extend,
        key
      })
    }),
    onInput: debounce(function({ target, key }) {
      this.buffer[key] = +target.value
      this.archiver.nowChange = key
    }),
    flush(changed)
    {
      let first, last, now, field, amount, price, qty, value

      first = this.archiver.firstChanged
      last = this.archiver.lastChanged
      now = this.archiver.nowChange

      field = this.byFirst ? first : last

      value = this[field]
      amount = this.amount
      price = this.price
      qty = this.qty

      switch (now) {
        case 'amount':
          switch (field) {
            case 'qty':
              price ??= changed / qty
              price && (value = changed / price)
              break
            case 'price':
              qty ??= changed / price
              qty && (value = changed / qty)
              break
          }
          break
        case 'price':
          switch (field) {
            case 'qty':
              amount ??= changed * qty
              amount && (value = amount / changed)
              break
            case 'amount':
              qty ??= amount / changed
              qty && (value = qty * changed)
              break
          }
          break
        case 'qty':
          switch (field) {
            case 'price':
              amount ??= price * changed
              amount && (value = amount / changed)
              break
            case 'amount':
              price ??= amount / changed
              price && (value = price * changed)
              break
          }
      }

      if (value >= Infinity) {
        value = 0
      }

      this.$store.commit(
        'setOrder',
        Object.assign(
          this.order,
          { amount, price, qty },
          {
            [field]: value,
            [now]: changed
          }
        )
      )
    }
  },
  beforeMount()
  {
    if (!localStorage.getItem('order')) {
      localStorage.setItem('order', stringify(this.order))
    }

    this.setStorage(localStorage.getItem('order'))
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
