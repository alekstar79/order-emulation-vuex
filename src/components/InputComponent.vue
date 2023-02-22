<template>
  <section class="row my-3">
    <div class="col-3">
      <input
        v-model="price"
        @change="onChange($event, 'price')"
        type="text"
        id="price"
        class="form-control"
        placeholder="Цена"
        ref="price"
      >
      <label for="price"><sub>Цена за единицу</sub></label>
    </div>
    <div class="col-3">
      <input
        v-model="qty"
        @change="onChange($event, 'qty')"
        type="text"
        id="qty"
        class="form-control"
        placeholder="Количество"
        ref="qty"
      >
      <label for="qty"><sub>Общее количество</sub></label>
    </div>
    <div class="col-3">
      <input
        v-model="amount"
        @change="onChange($event, 'amount')"
        type="text"
        id="amount"
        class="form-control"
        placeholder="Сумма"
        ref="amount"
      >
      <label for="amount"><sub>Общая стоимость</sub></label>
    </div>
    <div class="col-3">
      <button @click="$emit('send')" class="btn btn-outline-secondary">
        Добавить
      </button>
    </div>
  </section>
</template>

<script>
import { RuntimeValidator } from '@/utils/validator'

export default {
  name: 'InputComponent',

  computed: {
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
    }
  },
  data: () => ({
    validators: []
  }),
  methods: {
    onChange({ target }, key)
    {
      this.$emit('onChange', { target, key })
    }
  },
  async mounted() {
    await this.$nextTick()

    for (const ref in this.$refs) {
      this.validators.push(
        new RuntimeValidator(
          this.$refs[ref],
          [{
            id: ref,
            message: 'Not a Number',
            validator: (target, key) => {
              if (Number.isNaN(Number(target.value))) {
                target.value = target.value.toString().slice(0, target.value.length - 1)
                this.$store.commit('setOrder', { key, value: target.value })
                return false
              }

              return true
            }
          }]
        )
      )
    }
  }
}
</script>
