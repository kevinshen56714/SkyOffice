import { configureStore } from '@reduxjs/toolkit'
import computerReducer from './ComputerStore'
import userReducer from './UserStore'

const store = configureStore({
  reducer: {
    user: userReducer,
    computer: computerReducer,
  },
})

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch

export default store
