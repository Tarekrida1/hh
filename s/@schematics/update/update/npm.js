"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const url = require("url");
const RegistryClient = require('npm-registry-client');
const npmPackageJsonCache = new Map();
const npmConfigOptionCache = new Map();
function _readNpmRc() {
    return new rxjs_1.Observable(subject => {
        // TODO: have a way to read options without using fs directly.
        const path = require('path');
        const fs = require('fs');
        const perProjectNpmrc = path.resolve('.npmrc');
        let npmrc = '';
        if (fs.existsSync(perProjectNpmrc)) {
            npmrc = fs.readFileSync(perProjectNpmrc).toString('utf-8');
        }
        else {
            if (process.platform === 'win32') {
                if (process.env.LOCALAPPDATA) {
                    npmrc = fs.readFileSync(path.join(process.env.LOCALAPPDATA, '.npmrc')).toString('utf-8');
                }
            }
            else {
                if (process.env.HOME) {
                    npmrc = fs.readFileSync(path.join(process.env.HOME, '.npmrc')).toString('utf-8');
                }
            }
        }
        const allOptionsArr = npmrc.split(/\r?\n/).map(x => x.trim());
        const allOptions = {};
        allOptionsArr.forEach(x => {
            const [key, ...value] = x.split('=');
            allOptions[key.trim()] = value.join('=').trim();
        });
        subject.next(allOptions);
        subject.complete();
    }).pipe(operators_1.catchError(() => rxjs_1.of({})), operators_1.shareReplay());
}
function getOptionFromNpmRc(option) {
    return _readNpmRc().pipe(operators_1.map(options => options[option]));
}
function getOptionFromNpmCli(option) {
    return new rxjs_1.Observable(subject => {
        child_process_1.exec(`npm get ${option}`, (error, data) => {
            if (error) {
                throw error;
            }
            else {
                data = data.trim();
                if (!data || data === 'undefined' || data === 'null') {
                    subject.next();
                }
                else {
                    subject.next(data);
                }
            }
            subject.complete();
        });
    }).pipe(operators_1.catchError(() => rxjs_1.of(undefined)), operators_1.shareReplay());
}
function getNpmConfigOption(option, scope, tryWithoutScope) {
    if (scope && tryWithoutScope) {
        return rxjs_1.concat(getNpmConfigOption(option, scope), getNpmConfigOption(option)).pipe(operators_1.filter(result => !!result), operators_1.defaultIfEmpty(), operators_1.first());
    }
    const fullOption = `${scope ? scope + ':' : ''}${option}`;
    let value = npmConfigOptionCache.get(fullOption);
    if (value) {
        return value;
    }
    value = option.startsWith('_')
        ? getOptionFromNpmRc(fullOption)
        : getOptionFromNpmCli(fullOption);
    npmConfigOptionCache.set(fullOption, value);
    return value;
}
function getNpmClientSslOptions(strictSsl, cafile) {
    const sslOptions = {};
    if (strictSsl === 'false') {
        sslOptions.strict = false;
    }
    else if (strictSsl === 'true') {
        sslOptions.strict = true;
    }
    if (cafile) {
        sslOptions.ca = fs_1.readFileSync(cafile);
    }
    return sslOptions;
}
/**
 * Get the NPM repository's package.json for a package. This is p
 * @param {string} packageName The package name to fetch.
 * @param {string} registryUrl The NPM Registry URL to use.
 * @param {LoggerApi} logger A logger instance to log debug information.
 * @returns An observable that will put the pacakge.json content.
 * @private
 */
function getNpmPackageJson(packageName, registryUrl, logger) {
    const scope = packageName.startsWith('@') ? packageName.split('/')[0] : undefined;
    return (registryUrl ? rxjs_1.of(registryUrl) : getNpmConfigOption('registry', scope, true)).pipe(operators_1.map(partialUrl => {
        if (!partialUrl) {
            partialUrl = 'https://registry.npmjs.org/';
        }
        const partial = url.parse(partialUrl);
        let fullUrl = new url.URL(`http://${partial.host}/${packageName.replace(/\//g, '%2F')}`);
        try {
            const registry = new url.URL(partialUrl);
            registry.pathname = (registry.pathname || '')
                .replace(/\/?$/, '/' + packageName.replace(/\//g, '%2F'));
            fullUrl = new url.URL(url.format(registry));
        }
        catch (_a) { }
        logger.debug(`Getting package.json from '${packageName}' (url: ${JSON.stringify(fullUrl)})...`);
        return fullUrl;
    }), operators_1.concatMap(fullUrl => {
        let maybeRequest = npmPackageJsonCache.get(fullUrl.toString());
        if (maybeRequest) {
            return maybeRequest;
        }
        const registryKey = `//${fullUrl.host}/`;
        return rxjs_1.concat(getNpmConfigOption('proxy'), getNpmConfigOption('https-proxy'), getNpmConfigOption('strict-ssl'), getNpmConfigOption('cafile'), getNpmConfigOption('_auth'), getNpmConfigOption('_authToken', registryKey), getNpmConfigOption('username', registryKey, true), getNpmConfigOption('password', registryKey, true), getNpmConfigOption('email', registryKey, true), getNpmConfigOption('always-auth', registryKey, true)).pipe(operators_1.toArray(), operators_1.concatMap(options => {
            const [http, https, strictSsl, cafile, token, authToken, username, password, email, alwaysAuth,] = options;
            const subject = new rxjs_1.ReplaySubject(1);
            const sslOptions = getNpmClientSslOptions(strictSsl, cafile);
            const auth = {};
            if (alwaysAuth !== undefined) {
                auth.alwaysAuth = alwaysAuth === 'false' ? false : !!alwaysAuth;
            }
            if (email) {
                auth.email = email;
            }
            if (authToken) {
                auth.token = authToken;
            }
            else if (token) {
                try {
                    // attempt to parse "username:password" from base64 token
                    // to enable Artifactory / Nexus-like repositories support
                    const delimiter = ':';
                    const parsedToken = Buffer.from(token, 'base64').toString('ascii');
                    const [extractedUsername, ...passwordArr] = parsedToken.split(delimiter);
                    const extractedPassword = passwordArr.join(delimiter);
                    if (extractedUsername && extractedPassword) {
                        auth.username = extractedUsername;
                        auth.password = extractedPassword;
                    }
                    else {
                        throw new Error('Unable to extract username and password from _auth token');
                    }
                }
                catch (ex) {
                    auth.token = token;
                }
            }
            else if (username) {
                auth.username = username;
                auth.password = password;
            }
            const client = new RegistryClient({
                proxy: { http, https },
                ssl: sslOptions,
            });
            client.log.level = 'silent';
            const params = {
                timeout: 30000,
                auth,
            };
            client.get(fullUrl.toString(), params, (error, data) => {
                if (error) {
                    subject.error(error);
                }
                subject.next(data);
                subject.complete();
            });
            maybeRequest = subject.asObservable();
            npmPackageJsonCache.set(fullUrl.toString(), maybeRequest);
            return maybeRequest;
        }));
    }));
}
exports.getNpmPackageJson = getNpmPackageJson;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnBtLmpzIiwic291cmNlUm9vdCI6Ii4vIiwic291cmNlcyI6WyJwYWNrYWdlcy9zY2hlbWF0aWNzL3VwZGF0ZS91cGRhdGUvbnBtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsaURBQXFDO0FBQ3JDLDJCQUFrQztBQUNsQywrQkFBNkQ7QUFDN0QsOENBU3dCO0FBQ3hCLDJCQUEyQjtBQUczQixNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUV0RCxNQUFNLG1CQUFtQixHQUFHLElBQUksR0FBRyxFQUFnRCxDQUFDO0FBQ3BGLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxHQUFHLEVBQTBDLENBQUM7QUFHL0UsU0FBUyxVQUFVO0lBQ2pCLE9BQU8sSUFBSSxpQkFBVSxDQUE0QixPQUFPLENBQUMsRUFBRTtRQUN6RCw4REFBOEQ7UUFDOUQsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQzdCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUN6QixNQUFNLGVBQWUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxDQUFDO1FBRS9DLElBQUksS0FBSyxHQUFHLEVBQUUsQ0FBQztRQUVmLElBQUksRUFBRSxDQUFDLFVBQVUsQ0FBQyxlQUFlLENBQUMsRUFBRTtZQUNsQyxLQUFLLEdBQUcsRUFBRSxDQUFDLFlBQVksQ0FBQyxlQUFlLENBQUMsQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUM7U0FDNUQ7YUFBTTtZQUNMLElBQUksT0FBTyxDQUFDLFFBQVEsS0FBSyxPQUFPLEVBQUU7Z0JBQ2hDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUU7b0JBQzVCLEtBQUssR0FBRyxFQUFFLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsUUFBUSxDQUFDLENBQUMsQ0FBQyxR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Q3pCLElBQUksQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDO2FBQzFCO1lBRUQsTUFBTSxNQUFNLEdBQUcsSUFBSSxjQUFjLENBQUM7Z0JBQ2hDLEtBQUssRUFBRSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUU7Z0JBQ3RCLEdBQUcsRUFBRSxVQUFVO2FBQ2hCLENBQUMsQ0FBQztZQUNILE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLFFBQVEsQ0FBQztZQUM1QixNQUFNLE1BQU0sR0FBRztnQkFDYixPQUFPLEVBQUUsS0FBSztnQkFDZCxJQUFJO2FBQ0wsQ0FBQztZQUVGLE1BQU0sQ0FBQyxHQUFHLENBQ1IsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUNsQixNQUFNLEVBQ04sQ0FBQyxLQUFhLEVBQUUsSUFBOEIsRUFBRSxFQUFFO2dCQUNsRCxJQUFJLEtBQUssRUFBRTtvQkFDVCxPQUFPLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUN0QjtnQkFFRCxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO2dCQUNuQixPQUFPLENBQUMsUUFBUSxFQUFFLENBQUM7WUFDckIsQ0FBQyxDQUFDLENBQUM7WUFFSCxZQUFZLEdBQUcsT0FBTyxDQUFDLFlBQVksRUFBRSxDQUFDO1lBQ3RDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLEVBQUUsWUFBWSxDQUFDLENBQUM7WUFFMUQsT0FBTyxZQUFZLENBQUM7UUFDdEIsQ0FBQyxDQUFDLENBQ0gsQ0FBQztJQUNKLENBQUMsQ0FBQyxDQUNILENBQUM7QUFFSixDQUFDO0FBNUlELDhDQTRJQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7IGxvZ2dpbmcgfSBmcm9tICdAYW5ndWxhci1kZXZraXQvY29yZSc7XG5pbXBvcnQgeyBleGVjIH0gZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgeyByZWFkRmlsZVN5bmMgfSBmcm9tICdmcyc7XG5pbXBvcnQgeyBPYnNlcnZhYmxlLCBSZXBsYXlTdWJqZWN0LCBjb25jYXQsIG9mIH0gZnJvbSAncnhqcyc7XG5pbXBvcnQge1xuICBjYXRjaEVycm9yLFxuICBjb25jYXRNYXAsXG4gIGRlZmF1bHRJZkVtcHR5LFxuICBmaWx0ZXIsXG4gIGZpcnN0LFxuICBtYXAsXG4gIHNoYXJlUmVwbGF5LFxuICB0b0FycmF5LFxufSBmcm9tICdyeGpzL29wZXJhdG9ycyc7XG5pbXBvcnQgKiBhcyB1cmwgZnJvbSAndXJsJztcbmltcG9ydCB7IE5wbVJlcG9zaXRvcnlQYWNrYWdlSnNvbiB9IGZyb20gJy4vbnBtLXBhY2thZ2UtanNvbic7XG5cbmNvbnN0IFJlZ2lzdHJ5Q2xpZW50ID0gcmVxdWlyZSgnbnBtLXJlZ2lzdHJ5LWNsaWVudCcpO1xuXG5jb25zdCBucG1QYWNrYWdlSnNvbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8TnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uPj4oKTtcbmNvbnN0IG5wbUNvbmZpZ09wdGlvbkNhY2hlID0gbmV3IE1hcDxzdHJpbmcsIE9ic2VydmFibGU8c3RyaW5nIHwgdW5kZWZpbmVkPj4oKTtcblxuXG5mdW5jdGlvbiBfcmVhZE5wbVJjKCk6IE9ic2VydmFibGU8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4ge1xuICByZXR1cm4gbmV3IE9ic2VydmFibGU8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT4oc3ViamVjdCA9PiB7XG4gICAgLy8gVE9ETzogaGF2ZSBhIHdheSB0byByZWFkIG9wdGlvbnMgd2l0aG91dCB1c2luZyBmcyBkaXJlY3RseS5cbiAgICBjb25zdCBwYXRoID0gcmVxdWlyZSgncGF0aCcpO1xuICAgIGNvbnN0IGZzID0gcmVxdWlyZSgnZnMnKTtcbiAgICBjb25zdCBwZXJQcm9qZWN0TnBtcmMgPSBwYXRoLnJlc29sdmUoJy5ucG1yYycpO1xuXG4gICAgbGV0IG5wbXJjID0gJyc7XG5cbiAgICBpZiAoZnMuZXhpc3RzU3luYyhwZXJQcm9qZWN0TnBtcmMpKSB7XG4gICAgICBucG1yYyA9IGZzLnJlYWRGaWxlU3luYyhwZXJQcm9qZWN0TnBtcmMpLnRvU3RyaW5nKCd1dGYtOCcpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAocHJvY2Vzcy5wbGF0Zm9ybSA9PT0gJ3dpbjMyJykge1xuICAgICAgICBpZiAocHJvY2Vzcy5lbnYuTE9DQUxBUFBEQVRBKSB7XG4gICAgICAgICAgbnBtcmMgPSBmcy5yZWFkRmlsZVN5bmMocGF0aC5qb2luKHByb2Nlc3MuZW52LkxPQ0FMQVBQREFUQSwgJy5ucG1yYycpKS50b1N0cmluZygndXRmLTgnKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHByb2Nlc3MuZW52LkhPTUUpIHtcbiAgICAgICAgICBucG1yYyA9IGZzLnJlYWRGaWxlU3luYyhwYXRoLmpvaW4ocHJvY2Vzcy5lbnYuSE9NRSwgJy5ucG1yYycpKS50b1N0cmluZygndXRmLTgnKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGFsbE9wdGlvbnNBcnIgPSBucG1yYy5zcGxpdCgvXFxyP1xcbi8pLm1hcCh4ID0+IHgudHJpbSgpKTtcbiAgICBjb25zdCBhbGxPcHRpb25zOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9ID0ge307XG5cbiAgICBhbGxPcHRpb25zQXJyLmZvckVhY2goeCA9PiB7XG4gICAgICBjb25zdCBba2V5LCAuLi52YWx1ZV0gPSB4LnNwbGl0KCc9Jyk7XG4gICAgICBhbGxPcHRpb25zW2tleS50cmltKCldID0gdmFsdWUuam9pbignPScpLnRyaW0oKTtcbiAgICB9KTtcblxuICAgIHN1YmplY3QubmV4dChhbGxPcHRpb25zKTtcbiAgICBzdWJqZWN0LmNvbXBsZXRlKCk7XG4gIH0pLnBpcGUoXG4gICAgY2F0Y2hFcnJvcigoKSA9PiBvZih7fSkpLFxuICAgIHNoYXJlUmVwbGF5KCksXG4gICk7XG59XG5cblxuZnVuY3Rpb24gZ2V0T3B0aW9uRnJvbU5wbVJjKG9wdGlvbjogc3RyaW5nKTogT2JzZXJ2YWJsZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgcmV0dXJuIF9yZWFkTnBtUmMoKS5waXBlKFxuICAgIG1hcChvcHRpb25zID0+IG9wdGlvbnNbb3B0aW9uXSksXG4gICk7XG59XG5cbmZ1bmN0aW9uIGdldE9wdGlvbkZyb21OcG1DbGkob3B0aW9uOiBzdHJpbmcpOiBPYnNlcnZhYmxlPHN0cmluZyB8IHVuZGVmaW5lZD4ge1xuICByZXR1cm4gbmV3IE9ic2VydmFibGU8c3RyaW5nIHwgdW5kZWZpbmVkPihzdWJqZWN0ID0+IHtcbiAgICBleGVjKGBucG0gZ2V0ICR7b3B0aW9ufWAsIChlcnJvciwgZGF0YSkgPT4ge1xuICAgICAgaWYgKGVycm9yKSB7XG4gICAgICAgIHRocm93IGVycm9yO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZGF0YSA9IGRhdGEudHJpbSgpO1xuICAgICAgICBpZiAoIWRhdGEgfHwgZGF0YSA9PT0gJ3VuZGVmaW5lZCcgfHwgZGF0YSA9PT0gJ251bGwnKSB7XG4gICAgICAgICAgc3ViamVjdC5uZXh0KCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc3ViamVjdC5uZXh0KGRhdGEpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHN1YmplY3QuY29tcGxldGUoKTtcbiAgICB9KTtcbiAgfSkucGlwZShcbiAgICBjYXRjaEVycm9yKCgpID0+IG9mKHVuZGVmaW5lZCkpLFxuICAgIHNoYXJlUmVwbGF5KCksXG4gICk7XG59XG5cbmZ1bmN0aW9uIGdldE5wbUNvbmZpZ09wdGlvbihcbiAgb3B0aW9uOiBzdHJpbmcsXG4gIHNjb3BlPzogc3RyaW5nLFxuICB0cnlXaXRob3V0U2NvcGU/OiBib29sZWFuLFxuKTogT2JzZXJ2YWJsZTxzdHJpbmcgfCB1bmRlZmluZWQ+IHtcbiAgaWYgKHNjb3BlICYmIHRyeVdpdGhvdXRTY29wZSkge1xuICAgIHJldHVybiBjb25jYXQoXG4gICAgICBnZXROcG1Db25maWdPcHRpb24ob3B0aW9uLCBzY29wZSksXG4gICAgICBnZXROcG1Db25maWdPcHRpb24ob3B0aW9uKSxcbiAgICApLnBpcGUoXG4gICAgICBmaWx0ZXIocmVzdWx0ID0+ICEhcmVzdWx0KSxcbiAgICAgIGRlZmF1bHRJZkVtcHR5KCksXG4gICAgICBmaXJzdCgpLFxuICAgICk7XG4gIH1cblxuICBjb25zdCBmdWxsT3B0aW9uID0gYCR7c2NvcGUgPyBzY29wZSArICc6JyA6ICcnfSR7b3B0aW9ufWA7XG5cbiAgbGV0IHZhbHVlID0gbnBtQ29uZmlnT3B0aW9uQ2FjaGUuZ2V0KGZ1bGxPcHRpb24pO1xuICBpZiAodmFsdWUpIHtcbiAgICByZXR1cm4gdmFsdWU7XG4gIH1cblxuICB2YWx1ZSA9IG9wdGlvbi5zdGFydHNXaXRoKCdfJylcbiAgICAgID8gZ2V0T3B0aW9uRnJvbU5wbVJjKGZ1bGxPcHRpb24pXG4gICAgICA6IGdldE9wdGlvbkZyb21OcG1DbGkoZnVsbE9wdGlvbik7XG5cbiAgbnBtQ29uZmlnT3B0aW9uQ2FjaGUuc2V0KGZ1bGxPcHRpb24sIHZhbHVlKTtcblxuICByZXR1cm4gdmFsdWU7XG59XG5cbmZ1bmN0aW9uIGdldE5wbUNsaWVudFNzbE9wdGlvbnMoc3RyaWN0U3NsPzogc3RyaW5nLCBjYWZpbGU/OiBzdHJpbmcpIHtcbiAgY29uc3Qgc3NsT3B0aW9uczogeyBzdHJpY3Q/OiBib29sZWFuLCBjYT86IEJ1ZmZlciB9ID0ge307XG5cbiAgaWYgKHN0cmljdFNzbCA9PT0gJ2ZhbHNlJykge1xuICAgIHNzbE9wdGlvbnMuc3RyaWN0ID0gZmFsc2U7XG4gIH0gZWxzZSBpZiAoc3RyaWN0U3NsID09PSAndHJ1ZScpIHtcbiAgICBzc2xPcHRpb25zLnN0cmljdCA9IHRydWU7XG4gIH1cblxuICBpZiAoY2FmaWxlKSB7XG4gICAgc3NsT3B0aW9ucy5jYSA9IHJlYWRGaWxlU3luYyhjYWZpbGUpO1xuICB9XG5cbiAgcmV0dXJuIHNzbE9wdGlvbnM7XG59XG5cbi8qKlxuICogR2V0IHRoZSBOUE0gcmVwb3NpdG9yeSdzIHBhY2thZ2UuanNvbiBmb3IgYSBwYWNrYWdlLiBUaGlzIGlzIHBcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYWNrYWdlTmFtZSBUaGUgcGFja2FnZSBuYW1lIHRvIGZldGNoLlxuICogQHBhcmFtIHtzdHJpbmd9IHJlZ2lzdHJ5VXJsIFRoZSBOUE0gUmVnaXN0cnkgVVJMIHRvIHVzZS5cbiAqIEBwYXJhbSB7TG9nZ2VyQXBpfSBsb2dnZXIgQSBsb2dnZXIgaW5zdGFuY2UgdG8gbG9nIGRlYnVnIGluZm9ybWF0aW9uLlxuICogQHJldHVybnMgQW4gb2JzZXJ2YWJsZSB0aGF0IHdpbGwgcHV0IHRoZSBwYWNha2dlLmpzb24gY29udGVudC5cbiAqIEBwcml2YXRlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXROcG1QYWNrYWdlSnNvbihcbiAgcGFja2FnZU5hbWU6IHN0cmluZyxcbiAgcmVnaXN0cnlVcmw6IHN0cmluZyB8IHVuZGVmaW5lZCxcbiAgbG9nZ2VyOiBsb2dnaW5nLkxvZ2dlckFwaSxcbik6IE9ic2VydmFibGU8UGFydGlhbDxOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24+PiB7XG4gIGNvbnN0IHNjb3BlID0gcGFja2FnZU5hbWUuc3RhcnRzV2l0aCgnQCcpID8gcGFja2FnZU5hbWUuc3BsaXQoJy8nKVswXSA6IHVuZGVmaW5lZDtcblxuICByZXR1cm4gKFxuICAgIHJlZ2lzdHJ5VXJsID8gb2YocmVnaXN0cnlVcmwpIDogZ2V0TnBtQ29uZmlnT3B0aW9uKCdyZWdpc3RyeScsIHNjb3BlLCB0cnVlKVxuICApLnBpcGUoXG4gICAgbWFwKHBhcnRpYWxVcmwgPT4ge1xuICAgICAgaWYgKCFwYXJ0aWFsVXJsKSB7XG4gICAgICAgIHBhcnRpYWxVcmwgPSAnaHR0cHM6Ly9yZWdpc3RyeS5ucG1qcy5vcmcvJztcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhcnRpYWwgPSB1cmwucGFyc2UocGFydGlhbFVybCk7XG4gICAgICBsZXQgZnVsbFVybCA9IG5ldyB1cmwuVVJMKGBodHRwOi8vJHtwYXJ0aWFsLmhvc3R9LyR7cGFja2FnZU5hbWUucmVwbGFjZSgvXFwvL2csICclMkYnKX1gKTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHJlZ2lzdHJ5ID0gbmV3IHVybC5VUkwocGFydGlhbFVybCk7XG4gICAgICAgIHJlZ2lzdHJ5LnBhdGhuYW1lID0gKHJlZ2lzdHJ5LnBhdGhuYW1lIHx8ICcnKVxuICAgICAgICAgICAgLnJlcGxhY2UoL1xcLz8kLywgJy8nICsgcGFja2FnZU5hbWUucmVwbGFjZSgvXFwvL2csICclMkYnKSk7XG4gICAgICAgIGZ1bGxVcmwgPSBuZXcgdXJsLlVSTCh1cmwuZm9ybWF0KHJlZ2lzdHJ5KSk7XG4gICAgICB9IGNhdGNoIHt9XG5cbiAgICAgIGxvZ2dlci5kZWJ1ZyhcbiAgICAgICAgYEdldHRpbmcgcGFja2FnZS5qc29uIGZyb20gJyR7cGFja2FnZU5hbWV9JyAodXJsOiAke0pTT04uc3RyaW5naWZ5KGZ1bGxVcmwpfSkuLi5gLFxuICAgICAgKTtcblxuICAgICAgcmV0dXJuIGZ1bGxVcmw7XG4gICAgfSksXG4gICAgY29uY2F0TWFwKGZ1bGxVcmwgPT4ge1xuICAgICAgbGV0IG1heWJlUmVxdWVzdCA9IG5wbVBhY2thZ2VKc29uQ2FjaGUuZ2V0KGZ1bGxVcmwudG9TdHJpbmcoKSk7XG4gICAgICBpZiAobWF5YmVSZXF1ZXN0KSB7XG4gICAgICAgIHJldHVybiBtYXliZVJlcXVlc3Q7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlZ2lzdHJ5S2V5ID0gYC8vJHtmdWxsVXJsLmhvc3R9L2A7XG5cbiAgICAgIHJldHVybiBjb25jYXQoXG4gICAgICAgIGdldE5wbUNvbmZpZ09wdGlvbigncHJveHknKSxcbiAgICAgICAgZ2V0TnBtQ29uZmlnT3B0aW9uKCdodHRwcy1wcm94eScpLFxuICAgICAgICBnZXROcG1Db25maWdPcHRpb24oJ3N0cmljdC1zc2wnKSxcbiAgICAgICAgZ2V0TnBtQ29uZmlnT3B0aW9uKCdjYWZpbGUnKSxcbiAgICAgICAgZ2V0TnBtQ29uZmlnT3B0aW9uKCdfYXV0aCcpLFxuICAgICAgICBnZXROcG1Db25maWdPcHRpb24oJ19hdXRoVG9rZW4nLCByZWdpc3RyeUtleSksXG4gICAgICAgIGdldE5wbUNvbmZpZ09wdGlvbigndXNlcm5hbWUnLCByZWdpc3RyeUtleSwgdHJ1ZSksXG4gICAgICAgIGdldE5wbUNvbmZpZ09wdGlvbigncGFzc3dvcmQnLCByZWdpc3RyeUtleSwgdHJ1ZSksXG4gICAgICAgIGdldE5wbUNvbmZpZ09wdGlvbignZW1haWwnLCByZWdpc3RyeUtleSwgdHJ1ZSksXG4gICAgICAgIGdldE5wbUNvbmZpZ09wdGlvbignYWx3YXlzLWF1dGgnLCByZWdpc3RyeUtleSwgdHJ1ZSksXG4gICAgICApLnBpcGUoXG4gICAgICAgIHRvQXJyYXkoKSxcbiAgICAgICAgY29uY2F0TWFwKG9wdGlvbnMgPT4ge1xuICAgICAgICAgIGNvbnN0IFtcbiAgICAgICAgICAgIGh0dHAsXG4gICAgICAgICAgICBodHRwcyxcbiAgICAgICAgICAgIHN0cmljdFNzbCxcbiAgICAgICAgICAgIGNhZmlsZSxcbiAgICAgICAgICAgIHRva2VuLFxuICAgICAgICAgICAgYXV0aFRva2VuLFxuICAgICAgICAgICAgdXNlcm5hbWUsXG4gICAgICAgICAgICBwYXNzd29yZCxcbiAgICAgICAgICAgIGVtYWlsLFxuICAgICAgICAgICAgYWx3YXlzQXV0aCxcbiAgICAgICAgICBdID0gb3B0aW9ucztcblxuICAgICAgICAgIGNvbnN0IHN1YmplY3QgPSBuZXcgUmVwbGF5U3ViamVjdDxOcG1SZXBvc2l0b3J5UGFja2FnZUpzb24+KDEpO1xuXG4gICAgICAgICAgY29uc3Qgc3NsT3B0aW9ucyA9IGdldE5wbUNsaWVudFNzbE9wdGlvbnMoc3RyaWN0U3NsLCBjYWZpbGUpO1xuXG4gICAgICAgICAgY29uc3QgYXV0aDoge1xuICAgICAgICAgICAgdG9rZW4/OiBzdHJpbmcsXG4gICAgICAgICAgICBhbHdheXNBdXRoPzogYm9vbGVhbjtcbiAgICAgICAgICAgIHVzZXJuYW1lPzogc3RyaW5nO1xuICAgICAgICAgICAgcGFzc3dvcmQ/OiBzdHJpbmc7XG4gICAgICAgICAgICBlbWFpbD86IHN0cmluZztcbiAgICAgICAgICB9ID0ge307XG5cbiAgICAgICAgICBpZiAoYWx3YXlzQXV0aCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBhdXRoLmFsd2F5c0F1dGggPSBhbHdheXNBdXRoID09PSAnZmFsc2UnID8gZmFsc2UgOiAhIWFsd2F5c0F1dGg7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGVtYWlsKSB7XG4gICAgICAgICAgICBhdXRoLmVtYWlsID0gZW1haWw7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGF1dGhUb2tlbikge1xuICAgICAgICAgICAgYXV0aC50b2tlbiA9IGF1dGhUb2tlbjtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRva2VuKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAvLyBhdHRlbXB0IHRvIHBhcnNlIFwidXNlcm5hbWU6cGFzc3dvcmRcIiBmcm9tIGJhc2U2NCB0b2tlblxuICAgICAgICAgICAgICAvLyB0byBlbmFibGUgQXJ0aWZhY3RvcnkgLyBOZXh1cy1saWtlIHJlcG9zaXRvcmllcyBzdXBwb3J0XG4gICAgICAgICAgICAgIGNvbnN0IGRlbGltaXRlciA9ICc6JztcbiAgICAgICAgICAgICAgY29uc3QgcGFyc2VkVG9rZW4gPSBCdWZmZXIuZnJvbSh0b2tlbiwgJ2Jhc2U2NCcpLnRvU3RyaW5nKCdhc2NpaScpO1xuICAgICAgICAgICAgICBjb25zdCBbZXh0cmFjdGVkVXNlcm5hbWUsIC4uLnBhc3N3b3JkQXJyXSA9IHBhcnNlZFRva2VuLnNwbGl0KGRlbGltaXRlcik7XG4gICAgICAgICAgICAgIGNvbnN0IGV4dHJhY3RlZFBhc3N3b3JkID0gcGFzc3dvcmRBcnIuam9pbihkZWxpbWl0ZXIpO1xuXG4gICAgICAgICAgICAgIGlmIChleHRyYWN0ZWRVc2VybmFtZSAmJiBleHRyYWN0ZWRQYXNzd29yZCkge1xuICAgICAgICAgICAgICAgIGF1dGgudXNlcm5hbWUgPSBleHRyYWN0ZWRVc2VybmFtZTtcbiAgICAgICAgICAgICAgICBhdXRoLnBhc3N3b3JkID0gZXh0cmFjdGVkUGFzc3dvcmQ7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdVbmFibGUgdG8gZXh0cmFjdCB1c2VybmFtZSBhbmQgcGFzc3dvcmQgZnJvbSBfYXV0aCB0b2tlbicpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICBhdXRoLnRva2VuID0gdG9rZW47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmICh1c2VybmFtZSkge1xuICAgICAgICAgICAgYXV0aC51c2VybmFtZSA9IHVzZXJuYW1lO1xuICAgICAgICAgICAgYXV0aC5wYXNzd29yZCA9IHBhc3N3b3JkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGNvbnN0IGNsaWVudCA9IG5ldyBSZWdpc3RyeUNsaWVudCh7XG4gICAgICAgICAgICBwcm94eTogeyBodHRwLCBodHRwcyB9LFxuICAgICAgICAgICAgc3NsOiBzc2xPcHRpb25zLFxuICAgICAgICAgIH0pO1xuICAgICAgICAgIGNsaWVudC5sb2cubGV2ZWwgPSAnc2lsZW50JztcbiAgICAgICAgICBjb25zdCBwYXJhbXMgPSB7XG4gICAgICAgICAgICB0aW1lb3V0OiAzMDAwMCxcbiAgICAgICAgICAgIGF1dGgsXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGNsaWVudC5nZXQoXG4gICAgICAgICAgICBmdWxsVXJsLnRvU3RyaW5nKCksXG4gICAgICAgICAgICBwYXJhbXMsXG4gICAgICAgICAgICAoZXJyb3I6IG9iamVjdCwgZGF0YTogTnBtUmVwb3NpdG9yeVBhY2thZ2VKc29uKSA9PiB7XG4gICAgICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgc3ViamVjdC5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN1YmplY3QubmV4dChkYXRhKTtcbiAgICAgICAgICAgIHN1YmplY3QuY29tcGxldGUoKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIG1heWJlUmVxdWVzdCA9IHN1YmplY3QuYXNPYnNlcnZhYmxlKCk7XG4gICAgICAgICAgbnBtUGFja2FnZUpzb25DYWNoZS5zZXQoZnVsbFVybC50b1N0cmluZygpLCBtYXliZVJlcXVlc3QpO1xuXG4gICAgICAgICAgcmV0dXJuIG1heWJlUmVxdWVzdDtcbiAgICAgICAgfSksXG4gICAgICApO1xuICAgIH0pLFxuICApO1xuXG59XG4iXX0=