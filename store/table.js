import Vue from 'vue'
import {
  socketTable
} from '../middleware/models/table'
export const state = () => ({

  table_number: 3,
  token: null,
  tpayment: 0,
  persons: [],
  payment: {},
  yourOrdersCost: 0,
  yourOrdersPaid: 0,
  you: {
    orders: []
  },
})

export const getters = {

  totalWishToPay(state) {
    let others = state.persons.reduce((sum, person) => {
      let innerSum = person.orders.reduce((innerSum, order) => order.wish_to_pay + innerSum, 0)
      return innerSum + sum
    }, 0)
    // let others = state.persons.reduce((Sum, person) => person.totalPaid + Sum, 0)
    // return others + state.you.orders.reduce((Sum, order) => order.wish_to_pay + Sum, 0)
    return others
  },

}

export const mutations = {
  setToken(state, table) {
    state.token = table.token
  },
  newPerson(state, person) {
    state.you = person
  },

  setData(state, rawData) {
    // this is raw data from socket
    // compute data by person and his orders
    // back-end doesn't give product name on table ... 
    //.. so get it from cafe store
    // first compute an array of products from categories
    let products = this.state.cafe.categories.map(c => c.products)
    products = [].concat.apply([], products)
    let table = new socketTable(rawData, products)
    console.log('table', table);
    state.persons = table.persons
    state.payment = rawData.payment_info

  },

  updateTableDetail(state, data) {

  },
  setOrder(state, orderData) {
    state.yourOrdersCost = orderData.totalPrice
    state.you.orders = orderData.orders
  },
  payWholeBill(state) {
    // for (const order of state.you.orders) {
    //   order.wish_to_pay =order.payment_info.total_amount - order.payment_info.payed_amount
    // }
    for (const person of state.persons) {
      for (const order of person.orders) {
        order.wish_to_pay = order.payment_info.total_amount - order.payment_info.payed_amount
      }
    }
  },
  setDefaultPayment(state) {
    for (const person of state.persons) {
      for (const order of person.orders) {
        order.wish_to_pay = 0
      }
    }
  },
  changeWishToPay(state, orderIdentity) {
    // if (state.you.name == orderIdentity.name) {
    //   state.you.orders[orderIdentity.index].wish_to_pay = orderIdentity.value
    // } else {
    //   for (const person of state.persons) {
    //     if (person.name == orderIdentity.name) {
    //       person.orders[orderIdentity.index].wish_to_pay = orderIdentity.value
    //       break
    //     }
    //   }
    // }
    for (const person of state.persons) {

      if (person.name == orderIdentity.name) {
        person.orders[orderIdentity.index].wish_to_pay = orderIdentity.value
        break
      }
    }
  },

  setPayment: (state, value) => state.tpayment = value,

  submitPayment(state, payload) {

    // your orders
    state.yourOrdersPaid += state.you.orders.reduce((sum, order) => order.wish_to_pay + sum, 0)
    for (const order of state.you.orders) {
      if (order.wish_to_pay > 0) {
        order.order.my_payments.payed_amount += order.wish_to_pay
        order.payment_info.payed_amount += order.order.my_payments.payed_amount
        order.wish_to_pay = 0
      }
    }

    // other orders
    for (const person of state.persons) {
      person.totalPaid += person.orders.reduce((sum, order) => order.wish_to_pay + sum, 0)
      for (const order of person.orders) {
        if (order.wish_to_pay > 0) {
          order.order.my_payments.payed_amount += order.wish_to_pay
          order.payment_info.payed_amount += order.order.my_payments.payed_amount
          order.wish_to_pay = 0
        }
      }
    }
  },

  clearWishToPay(state) {
    // wish to pay to 0 because we dont have redirection to the bank yet
    // maybe need it for good
    for (const person of state.persons) {
      for (const order of person.orders) {
        if (order.wish_to_pay > 0) {
          order.wish_to_pay = 0
        }
      }
    }
  }


}

export const actions = {
  tableConnection(context) {
    let joinRequest = {
      request: {
        endpoint: `table/${context.state.token}/join/simple/by-token/`,
        data: {},
        headers: {
          Authorization: "Token " + context.rootState.token
        },
        method: "WATCH"
      }
    };
    let joinRequest_str = JSON.stringify(joinRequest);
    Vue.prototype.$socket.send(joinRequest_str);

  },

  addProduct(context, command) {
    let addProductRequest = {
      request: {
        endpoint: `table/${context.state.token}/product/${command.productId}/`,
        data: {},
        headers: {
          Authorization: "Token " + context.rootState.token
        },
        method: command.method
      }
    };

    let addProductRequest_str = JSON.stringify(addProductRequest);
    console.log('add product', addProductRequest_str);
    Vue.prototype.$socket.send(addProductRequest_str);

  },

  async submitPayment(context, payload) {
    // for now that we dont have backend actual payment

    // first get the orders that you wish to pay
    let payments = []
    for (const person of context.state.persons) {
      for (const order of person.orders) {
        if (order.wish_to_pay > 0) {
          payments.push({
            pbr: order.pk,
            amount: order.wish_to_pay
          })
        }
      }
    }
    context.commit('setPayment', payload)
    context.commit('clearWishToPay')
    try {
      let data = await this.$axios.$post(`/api/v1/pbr/session/create/`, {
        payments
      }, {
        headers: {
          'Authorization': 'Token ' + context.rootState.token,
        }
      })
      console.log('invoice data', data);
      context.dispatch('paymentVerify', data.invoice_uuid)
    } catch (err) {

    }
  },
  async paymentVerify(context, id) {
    this.app.router.push('/paymentResult')
    // try {
    //   let data = await this.$axios.$get(`payment/verify/${id}/`, {
    //     headers: {
    //       'Authorization': 'Token ' + context.rootState.token,
    //     }
    //   })
    // } catch (err) {

    // }
  }
}
