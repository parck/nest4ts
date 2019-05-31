export type Param = {
    name: string,
    type: string,
    index: number;
}

export type Method = {
    subURL: string,
    httpMethod: string,
    params: Param[],
    middleWares: Function[],
    produces: string,
}

export type Router = {
    [methodName: string]: Method;
}

export type Clazz = {
    baseURL: string,
    routes: Router,
    middleWares: Function[],
    origins: string,
}

export let getClazz = (target): Clazz => {
    return (target.$Meta = target.$Meta || {baseURL: '', routes: {}})
};

export let getMethod = (target, methodName): Method => {
    let meta = getClazz(target);

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
export function REST(baseURL: string, middleWares?: Function[]) {
    return function (target) {
        let meta = getClazz(target.prototype);
        meta.baseURL = baseURL;
        meta.middleWares = middleWares;
    }
}

/**
 *
 * @param {string} origins
 * @param {Function[]} middleWares
 * @returns {(target) => void}
 * @constructor
 */
export function CrossOrigin(origins: string, middleWares?: Function[]) {
    return function (target) {
        let meta = getClazz(target.prototype);
        meta.origins = origins;
    }
}

let MethodFactory = (httpMethod: string) => {
    return (url?: string, middleWares?: any[]) => {
        return (target, methodName: string) => {

            let meta = getMethod(target, methodName);
            meta.subURL = url;
            meta.httpMethod = httpMethod;
            meta.middleWares = middleWares;

            // Sort parameter by param index
            meta.params.sort((param1: Param, param2: Param) => param1.index - param2.index);
        }
    }
};
/**
 *
 * @GET('/user/:name')
 * list(@PathParam('name') name:string)
 */
export let GET = MethodFactory('get');
export let POST = MethodFactory('post');
export let DELETE = MethodFactory('delete');
export let PUT = MethodFactory('put');

let ParamFactory = (paramType: string, paramName?: string) => {
    return (target, methodName: string, paramIndex: number) => {
        let meta = getMethod(target, methodName);
        meta.params.push({
            name: paramName ? paramName : paramType,
            index: paramIndex,
            type: paramType
        });
    }
};

let MethodParamFactory = (paramType: string) => {
    return (paramName: string) => {
        return ParamFactory(paramType, paramName)
    }
};

/**
 *
 * list(@PathParam('name') name:string)
 *
 */
export let Path = MethodParamFactory('path');
export let Query = MethodParamFactory('query');
export let Form = MethodParamFactory('form');
export let Cookie = MethodParamFactory('cookie');
export let Header = MethodParamFactory('header');

let ContextParamFactory = (paramType: string) => {
    return ParamFactory(paramType)
};

/**
 *
 * @GET('/get')
 * list(@Request request, @Response res)
 */
export let HttpRequest = ContextParamFactory('request');
export let HttpResponse = ContextParamFactory('response');

let ProducesFactory = (produces: string) => {
    return (target, methodName: string) => {
        let meta = getMethod(target, methodName);
        meta.produces = produces;
    }
};

export let Json = ProducesFactory('text/json;charset=UTF-8');
export let Html = ProducesFactory('text/html;charset=UTF-8');