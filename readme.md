# Duex

## Features

- 轻量级状态管理库.
- 支持`vue-devtools`.

### 如何创建

```js
// store.js
import Vue from 'vue'
import Duex from 'Duex'

Vue.use(Duex)

const store = new Duex({
  state: {},
  mutations: {},
  actions: {},
  plugins: []
})
```

### store实例

`store` 组件:

```js
import Vue from 'vue'
import store from './store'

// In your root Vue instance:
new Vue({
  store,
  render: h => h(YourApp)
})
// this.$store will be available in component
```

### store

- store.state `readonly`
- store.mutations
- store.actions
- store.commit(type, payload)
- store.dispatch(type, payload)
- store.subscribe(subscriber)
- store.replaceState(newState)
- store.mapState(map)
- store.mapActions(map)
- store.mapMutations(map)

## API

### Constructor

```js
const store = new Duex({ state, mutations, actions })
```

#### state

`state` 通过 `store.state` 来获取state的值, 使用 `store.replaceState(newState)` 更改root state.

#### mutations

```js
const mutations = {
  INCREMENT(state, amount = 1) {
    state.count += amount
  }
}

store.commit('INCREMENT', 10)
```

> **NOTE:** 只能在 *mutation* 中改变state.

#### actions

```js
const actions = {
  incrementAsync(store, id) {
    return getAmountByIdAsync(id).then(amount => {
      store.commit('INCREMENT', amount)
    })
  }
}

store.dispatch('incrementAsync', 42)
```

#### plugins

```js
const loggerPlugin = store => {
  store.subscribe(mutation => {
    console.log(mutation)
  })
}

new Duex({
  plugins: [loggerPlugin]
})
```

### store.subscribe(subscriber)

```js
const unsubscribe = store.subscribe((mutation, state) => {
  console.log(mutation.type)
  console.log(mutation.payload)
})
```

### store.replaceState(newState)

替换 root state.
