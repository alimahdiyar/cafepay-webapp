import Vue from 'vue'
import {
  Category
} from '../middleware/models/cafe'

export const state = () => ({
  pk: null,
  activeCategory: 1,
  name: null,
  avatar: null,
  cafepay_fee: 0,
  productChangeArray: [],
  categories: [],
  currentProduct: {},
  productsFork: [],
  productPageActive: false,
  flowType: null,
  tokenType: 'normal',
  totalCount: 0,
  storeRedirect: false,
  closed: false,
  active: false,
  list: [],
  fee_payer: false,
  header_image: null,
  my_credit_in_cafe: 0,
})

export const getters = {
  productsFlatten: state => {
    // remove MyOrder Category and prevent Duplication
    // JSON trick for not touching the source array
    let pureCategories = JSON.parse((JSON.stringify(state.categories)))
    pureCategories.shift()
    let products = pureCategories.map(c => c.products)
    return [].concat.apply([], products)

  },



  productById: (state, getters) => (id) => {
    return getters.productsFlatten.find(p => p.pk == id)
  }
}

export const mutations = {
  setBasic(state, data) {
    state.rate = (data.cafe.rate) ? data.cafe.rate : 4
    state.pk = data.cafe.pk
    state.name = data.cafe.name
    state.phone = data.cafe.phone
    state.closed = data.cafe.is_closed
    state.avatar = data.cafe.avatar
    state.has_delivery = data.cafe.has_delivery
    state.cafepay_fee = data.cafe.cafepay_fee
    state.fee_payer = data.cafe.fee_payer
    state.header_image = data.cafe.header_image
    state.payment_only = data.cafe.payment_only
    state.payment_first = data.cafe.payment_first
    state.my_credit_in_cafe = data.my_credit_in_cafe
    state.is_delivery = data.is_delivery
    state.delivery_regions = data.cafe.delivery_regions

    // define type of token ----- 0: menuonly   1: normal    2: preorder
    switch (data.type) {
      case '0':
        state.tokenType = 'menu-only'
        break;
      case '1':
        state.tokenType = 'normal'
        break;

      case '2':
        if (data.has_delivery) state.tokenType = 'delivery'
        else state.tokenType = 'pre-order'
        break;
    
      default:
        break;
    }


  },

  changeStoreRedirect(state, flag)  {
    state.storeRedirect = flag
  },

  setType(state, type) {
    state.tokenType = type
    
  },

  clear(state) {
    state.categories = []
    state.closed = false
    state.payment_only = false
    state.tokenType = 'normal'
    state.active = false
    state.totalCount = 0
    state.payment_first = false 
  },
  changeCount(state, setting) {
    state.totalCount += setting.count

    let theProduct = state.categories[setting.categoryIndex].products[setting.productIndex];
    theProduct.count += setting.count

    for (const category of state.categories) {
      for (const product of category.products) {
        if (theProduct.pk == product.pk) {
          product.count = theProduct.count
          break
        }
      }
    }
    
    if(theProduct.count > 0) {
      // check if product exist in my order category (firstCateogry) or not
      if(!state.categories[0].products.find(p => p.pk == theProduct.pk)) {
        state.categories[0].products.push(theProduct)
      }
    }
    // // if its not from filtered category indexes are legit so we need no find
    // if (!setting.filtered) {
    //   state.categories[setting.categoryIndex].products[setting.productIndex].count += setting.count
    // } else {
    //   // we have product id and we need to find it in out main menu and update it
    //   for (const category of state.categories) {
    //     for (const product of category.products) {
    //       if (setting.id == product.pk) {
    //         product.count += setting.count
    //         break;
    //       }
    //     }
    //   }
    // }
  },

  setMenu(state, menu) {
    state.active = true
    // clear categories in-case user re-enter 
    state.categories = []
    // push current basket of orders first for editing current orders
    // TODO: move this line out of store
    state.categories.push({
      localType: 'CURRENT_ORDER',
      pk: -1,
      name: this.app.i18n.t('menu_page.your_current_order'),
      products: []
    })

    let allProducts = menu.categories.sort((c1, c2) => c1.order - c2.order).reduce(
      (products, cat) => products.concat(cat.products),
      []
    )
    // Make them unique
    allProducts = allProducts.filter((prod, i) => allProducts.indexOf(prod) == i)
    state.categories.push(new Category({
      localType: 'ALL',
      pk: 0,
      title: this.app.i18n.t('menu_page.all_products'),
      products: allProducts
    }))

    for (const category of menu.categories) {
      state.categories.push(new Category(Object.assign({
        localType: 'CATEGORY',
      },category)))
    }
  },

  setCurrentProduct(state, product) {
    state.currentProduct = product
    state.productPageActive = true
  },
  clearProduct(state) {
    state.currentProduct = {}
    state.productPageActive = false
  },

  clearPCA: (state) => {
    state.productChangeArray = []
  },

  changeActiveCategory: (state, index) => {
    state.activeCategory = index
  },

  setList:(state, data) => {
    state.list = data
  },

  clearBasket(state){
    state.categories[0].products = []
  },
  bindProductCount(state, user) {
    state.categories[0].products = []

    for (const category of state.categories) {

      // Ignore categories that we created for Current Order and All products
      if (category.pk < 0) continue

      // if user == false that means we dont have any order anymore so clear products of user current category and reset counts on other categories
      if (!user && firstCategory) category.products = []
    
      if (user) {
        for (const product of category.products) {
          
          let matchedOrders = user.orders.filter(p => p.product == product.pk)
          product.reduceLimit = 0
          product.count = 0
          for (const matchedOrder of matchedOrders) {
            product.reduceLimit += Math.ceil(matchedOrder.payment_info.net_payed_amount / matchedOrder.unit_amount)
            product.count += matchedOrder.count
          }
          if(product.count > 0) {
            // check if product exist in my order category (firstCateogry) or not
            let matchedOrder_currentOrderCat = state.categories[0].products.find(p => p.pk == product.pk)
            if (matchedOrder_currentOrderCat) {
              matchedOrder_currentOrderCat.reduceLimit = product.reduceLimit
              matchedOrder_currentOrderCat.count = product.count
            } else state.categories[0].products.push(product)
          }
        }
      } else {
        for (const product of category.products) {
          product.count = 0
          product.reduceLimit = 0
        }
      }
    }

    state.totalCount = 0    
    if(user){
      for (const order of user.orders) {
        state.totalCount += order.count
      }
    }

    // fork menu for detect changes
    // let productsForkStr = JSON.stringify(this.getters.productsFlatten)
    // state.productsFork = JSON.parse(productsForkStr)
  },

  changeDetection(state, product) {
    // let's see if its already exist in product change array
    let MatchIndex = state.productChangeArray.findIndex(p => p.product == product.id)

    if (MatchIndex != -1) {
      // if it exist find it on the array and change it
      state.productChangeArray[MatchIndex].count += product.count
      state.productChangeArray[MatchIndex].capital += product.count * product.price
      if (state.productChangeArray[MatchIndex].count == 0) {
        state.productChangeArray = state.productChangeArray.filter(p => p.product != product.id)
      }

    } else {
      // if not push it to the array
      state.productChangeArray.push({
        product: product.id,
        count: product.count,
        capital: product.count * product.price
      })

    }
    // console.log('rpoduct change array', state.productChangeArray);


  },


}

export const actions = {
  async retrieveMenu(context) {
    try {
      let data = await this.$axios.$get(`/v1/cafe/${context.state.pk}/category-based-menu/active/`, {
        // params: {},
        // headers: {
        //   'Authorization': 'Token ' + context.rootState.token,
        // }
      })
      // console.log('cafe menu', data);
      context.commit('setMenu', data)
      context.commit('changeActiveCategory', 1)
      // after retrieving the menu we need to establish a connection with socket to retrieve table data
      // why after menu data ? because we need menu data for build table data
      // if sina give me the name of product with table data then we don't need this sequence anymore
      // connect to socket
      // console.log('state', context.state.tokenType);
      // determine that is user is logged in or Not if Yes we need to check if he has any order to furthur open the socket #DEPRECATED due to cashier orders now we just check loggedIn status
      // if (context.rootState.user.user.id) context.dispatch('user/hasActiveOrder', context.rootState.table.token , {root: true})

      console.log('state', context.state.tokenType);
      if (context.state.tokenType != 'menu-only' && !context.state.closed && context.rootState.user.user.id) Vue.prototype.$connect()
    } catch (err) {

    }
  },
    async retreiveList(context) {
      try {
        let data = await this.$axios.$get(`/v1/cafe/list/`, {
        })
        context.commit('setList', data)
      } catch (err) {

      }

    },
}
