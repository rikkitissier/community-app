import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import { createLogger } from "redux-logger";
import rootReducer from "./reducers";
import Reactotron from "../../ReactotronConfig";

const loggerMiddleware = createLogger();
let store = null;

export default function configureStore(preloadedState) {
	if (!store) {
		const middleware = applyMiddleware(thunkMiddleware /*loggerMiddleware*/);
		store = createStore(
			rootReducer,
			preloadedState,
			compose(
				middleware,
				Reactotron.createEnhancer()
			)
		);
	}

	return store;
}
