import { applyMiddleware, combineReducers, createStore } from "redux";
import thunk from "redux-thunk";

import curationResultReducer from "./reducers/curationResultReducer";

const rootReducer = combineReducers({
  curationResult: curationResultReducer,
});

const store = createStore(rootReducer, undefined, applyMiddleware(thunk));

export default store;
