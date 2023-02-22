import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    events: [],

    storage: {},

    order: {
      amount: 0,
      nonce: 0,
      price: 0,
      qty: 0
    }
  },
  getters: {
    amount(state) {
      Object.assign(state.order, { amount: state.order.price * state.order.qty })

      const { amount } = state.order

      return Number(amount) > 0 ? amount : null
    },
    price(state) {
      const { price } = state.order

      return Number(price) > 0 ? price : null
    },
    qty(state) {
      const { qty } = state.order

      return Number(qty) > 0 ? qty : null
    }
  },
  mutations: {
    setStorage(state, payload)
    {
      state.storage = payload
    },
    setAmount(state, { amount })
    {
      state.order.amount = amount
    },
    setPrice(state, { price })
    {
      state.order.price = price
    },
    setQty(state, { qty })
    {
      state.order.qty = qty
    },
    setNonce(state, { nonce })
    {
      state.order.nonce = nonce
    },
    setOrder(state, { key, value })
    {
      state.order[key] = value
    }
  },
  actions: {
  }
})
