import app from "./app";
import auth from "./auth";
import editor from "./editor";
import forums from "./forums";
import site from "./site";
import user from "./user";
import { combineReducers } from "redux";

export default combineReducers({ app, auth, user, editor, site, forums }); // app, auth, user, editor, site, forums });
