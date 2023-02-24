import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    storage: {},
    events: [],
    order: {
      amount: 0,
      nonce: 0,
      price: 0,
      qty: 0
    }
  },
  getters: {
    order(state) {
      return state.order
    },
    nonce(state) {
      return Number(state.order.nonce)
    },
    amount(state) {
      const amount = Number(state.order.amount)

      return amount > 0 ? amount : null
    },
    price(state) {
      const price = Number(state.order.price)

      return price > 0 ? price : null
    },
    qty(state) {
      const qty = Number(state.order.qty)

      return qty > 0 ? qty : null
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
    setOrderByKey(state, { key, value })
    {
      state.order[key] = value
    },
    setOrder(state, payload)
    {
      state.order = payload
    }
  }
})
