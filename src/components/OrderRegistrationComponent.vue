<template>
  <div class="container">
    <section class="row">
      <div class="col-12">
        <nav class="navbar navbar-light bg-light">
          <div class="container-fluid">
            <span class="navbar-brand">Эмулятор заказа</span>
          </div>
        </nav>
      </div>
    </section>

    <InputComponent @onChange="onChange" @send="send" />

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
import { mapMutations } from 'vuex'

export default {
  name: 'OrderRegistrationComponent',

  components: {
    InputComponent
  },

  data: () => ({
    validators: [],
    events: []
  }),
  computed: {
    representation()
    {
      return `<pre>${stringify(this.storage)}</pre>`
    },
    order()
    {
      return this.$store.state.order
    },
    storage()
    {
      return this.$store.state.storage
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
      this.$store.commit('setNonce', { nonce: ++this.order.nonce })

      this.events.unshift({
        key, desc: `${this.order.nonce} ${key} ${action} ${target?.value || ''}`, extend
      })
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
