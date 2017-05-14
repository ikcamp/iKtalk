import { createStore } from 'redux'

const initialState = {}

function reducers(state = initialState, action) {
  switch (action.type) {
  case 'UPDATE_USER':
    return {
      ...state,
      user: action.payload
    }
  default:
    return state
  }
}

let store = createStore(reducers)

export default store