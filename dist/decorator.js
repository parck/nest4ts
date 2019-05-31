"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClazz = (target) => {
    return (target.$Meta = target.$Meta || { baseURL: '', routes: {} });
};
exports.getMethod = (target, methodName) => {
    let meta = exports.getClazz(target);
    return meta.routes[methodName] || (meta.routes[methodName] = {
        subURL: '',
        httpMethod: '',
        middleWares: [],
        params: [],
        produces: 'text/json;charset=UTF-8'
    });
};
/**
 * Service class decorator.
 *
 * @Path('/user')
 * class UserService {
 * }
 *
 */
function REST(baseURL, middleWares) {
    return function (target) {
        let meta = exports.getClazz(target.prototype);
        meta.baseURL = baseURL;
        meta.middleWares = middleWares;
    };
}
exports.REST = REST;
/**
 *
 * @param {string} origins
 * @param {Function[]} middleWares
 * @returns {(target) => void}
 * @constructor
 */
function CrossOrigin(origins, middleWares) {
    return function (target) {
        let meta = exports.getClazz(target.prototype);
        meta.origins = origins;
    };
}
exports.CrossOrigin = CrossOrigin;
let MethodFactory = (httpMethod) => {
    return (url, middleWares) => {
        return (target, methodName) => {
            let meta = exports.getMethod(target, methodName);
            meta.subURL = url;
            meta.httpMethod = httpMethod;
            meta.middleWares = middleWares;
            // Sort parameter by param index
            meta.params.sort((param1, param2) => param1.index - param2.index);
        };
    };
};
/**
 *
 * @GET('/user/:name')
 * list(@PathParam('name') name:string)
 */
exports.GET = MethodFactory('get');
exports.POST = MethodFactory('post');
exports.DELETE = MethodFactory('delete');
exports.PUT = MethodFactory('put');
let ParamFactory = (paramType, paramName) => {
    return (target, methodName, paramIndex) => {
        let meta = exports.getMethod(target, methodName);
        meta.params.push({
            name: paramName ? paramName : paramType,
            index: paramIndex,
            type: paramType
        });
    };
};
let MethodParamFactory = (paramType) => {
    return (paramName) => {
        return ParamFactory(paramType, paramName);
    };
};
/**
 *
 * list(@PathParam('name') name:string)
 *
 */
exports.Path = MethodParamFactory('path');
exports.Query = MethodParamFactory('query');
exports.Form = MethodParamFactory('form');
exports.Cookie = MethodParamFactory('cookie');
exports.Header = MethodParamFactory('header');
let ContextParamFactory = (paramType) => {
    return ParamFactory(paramType);
};
/**
 *
 * @GET('/get')
 * list(@Request request, @Response res)
 */
exports.HttpRequest = ContextParamFactory('request');
exports.HttpResponse = ContextParamFactory('response');
let ProducesFactory = (produces) => {
    return (target, methodName) => {
        let meta = exports.getMethod(target, methodName);
        meta.produces = produces;
    };
};
exports.Json = ProducesFactory('text/json;charset=UTF-8');
exports.Html = ProducesFactory('text/html;charset=UTF-8');
