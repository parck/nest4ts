import * as express from 'express';
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import {getClazz, Param} from './decorator'

/**
 * Extract paramters from request.
 */
function extractParameters(req, res, params: Param[]) {
    let args = [];
    if (!params) return;

    let paramHandlerTpe = {
        'query': (paramName: string) => req.query[paramName],
        'path': (paramName: string) => req.params[paramName],
        'form': (paramName: string) => req.body[paramName],
        'cookie': (paramName: string) => req.cookies && req.cookies[paramName],
        'header': (paramName) => req.get(paramName),
        'request': () => req,
        'response': () => res,
    };

    params.forEach(param => {
        args.push(paramHandlerTpe[param.type](param.name))
    });

    return args;
}

/**
 * Register Service Class.
 *
 * ```
 * start(express, [servies])
 * ```
 */
export function start(port, classes: any[]) {

    let router = express.Router();
    let app = express();

    classes.forEach(clazz => {
        let meta = getClazz(clazz.prototype);
        let instance = new clazz();
        let routes = meta.routes;
        let origins = meta.origins;

        for (const methodName in routes) {
            let methodMeta = routes[methodName];
            let httpMethod = methodMeta.httpMethod;
            let middleWares = methodMeta.middleWares;
            let produces = methodMeta.produces;

            // express router callback
            let fn = (req, res, next) => {
                let params = extractParameters(req, res, methodMeta['params']);
                let result = clazz.prototype[methodName].apply(instance, params);

                if (produces) res.header("Content-Type", produces);
                if (origins) {
                    res.header("Access-Control-Allow-Credentials", "true");
                    res.header("Access-Control-Allow-Origin", origins);
                }
                if (result instanceof Promise) {
                    result.then(value => {
                        !res.headersSent && res.send(value);
                    }).catch(err => {
                        next(err);
                    });
                } else if (result !== undefined) {
                    !res.headersSent && res.send(result);
                }
            };

            // register sub route
            let params: any[] = [methodMeta.subURL];
            middleWares && (params = params.concat(middleWares));
            params.push(fn);
            router[httpMethod].apply(router, params);
        }

        // regiser base router.
        let params: any[] = [meta.baseURL, bodyParser.json(), cookieParser()];
        meta.middleWares && (params = params.concat(meta.middleWares));
        params.push(router);
        app.use.apply(app, params);
    });

    app.use(express.static("views"));

    app.get('/', function (req, res) {
        return res.sendfile(__dirname + "/example/views/index.html");
    });

    app.listen(port, function () {
        let host = this.address().address;
        let port = this.address().port;

        console.log('Example app listening at http://%s:%s', host, port);
    });
}