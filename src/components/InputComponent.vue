<template>
  <section class="row my-3">
    <div class="col-3">
      <input
        :value="price"
        @input="onInput($event, 'price')"
        @change="onChange({ key: 'price' })"
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
        :value="qty"
        @input="onInput($event, 'qty')"
        @change="onChange({ key: 'qty' })"
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
        :value="amount"
        @input="onInput($event, 'amount')"
        @change="onChange({ key: 'amount' })"
        type="text"
        id="amount"
        class="form-control"
        placeholder="Сумма"
        ref="amount"
      >
      <label for="amount"><sub>Общая стоимость</sub></label>
    </div>
    <div class="col-3">
      <button
        class="btn btn-outline-secondary"
        @click="$emit('send')"
        :disabled="forbidden"
      >
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
    forbidden() {
      return Object.keys(this.$store.getters.order).filter(k => k !== 'nonce')
        .some(k => this.$store.getters.order[k] === null)
    },
    amount() {
      return this.$store.getters.amount
    },
    price() {
      return this.$store.getters.price
    },
    qty() {
        return this.$store.getters.qty
    }
  },
  data: () => ({
    validators: []
  }),
  methods: {
    onInput({ target }, key)
    {
      this.$emit('onInput', { target, key })
    },
    onChange({ key })
    {
      this.$emit('onChange', { key })
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
            validator: target => {
              if (Number.isNaN(Number(target.value))) {
                target.value = target.value.toString().slice(0, target.value.length - 1)
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
