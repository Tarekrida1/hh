/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/**
 * @description
 *
 * Provides a way to customize when activated routes get reused.
 *
 * @publicApi
 */
var RouteReuseStrategy = /** @class */ (function () {
    function RouteReuseStrategy() {
    }
    return RouteReuseStrategy;
}());
export { RouteReuseStrategy };
/**
 * Does not detach any subtrees. Reuses routes as long as their route config is the same.
 */
var DefaultRouteReuseStrategy = /** @class */ (function () {
    function DefaultRouteReuseStrategy() {
    }
    DefaultRouteReuseStrategy.prototype.shouldDetach = function (route) { return false; };
    DefaultRouteReuseStrategy.prototype.store = function (route, detachedTree) { };
    DefaultRouteReuseStrategy.prototype.shouldAttach = function (route) { return false; };
    DefaultRouteReuseStrategy.prototype.retrieve = function (route) { return null; };
    DefaultRouteReuseStrategy.prototype.shouldReuseRoute = function (future, curr) {
        return future.routeConfig === curr.routeConfig;
    };
    return DefaultRouteReuseStrategy;
}());
export { DefaultRouteReuseStrategy };

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicm91dGVfcmV1c2Vfc3RyYXRlZ3kuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9yb3V0ZXIvc3JjL3JvdXRlX3JldXNlX3N0cmF0ZWd5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7R0FNRztBQTJCSDs7Ozs7O0dBTUc7QUFDSDtJQUFBO0lBbUJBLENBQUM7SUFBRCx5QkFBQztBQUFELENBQUMsQUFuQkQsSUFtQkM7O0FBRUQ7O0dBRUc7QUFDSDtJQUFBO0lBUUEsQ0FBQztJQVBDLGdEQUFZLEdBQVosVUFBYSxLQUE2QixJQUFhLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQztJQUN0RSx5Q0FBSyxHQUFMLFVBQU0sS0FBNkIsRUFBRSxZQUFpQyxJQUFTLENBQUM7SUFDaEYsZ0RBQVksR0FBWixVQUFhLEtBQTZCLElBQWEsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDO0lBQ3RFLDRDQUFRLEdBQVIsVUFBUyxLQUE2QixJQUE4QixPQUFPLElBQUksQ0FBQyxDQUFDLENBQUM7SUFDbEYsb0RBQWdCLEdBQWhCLFVBQWlCLE1BQThCLEVBQUUsSUFBNEI7UUFDM0UsT0FBTyxNQUFNLENBQUMsV0FBVyxLQUFLLElBQUksQ0FBQyxXQUFXLENBQUM7SUFDakQsQ0FBQztJQUNILGdDQUFDO0FBQUQsQ0FBQyxBQVJELElBUUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5cbmltcG9ydCB7Q29tcG9uZW50UmVmfSBmcm9tICdAYW5ndWxhci9jb3JlJztcblxuaW1wb3J0IHtPdXRsZXRDb250ZXh0fSBmcm9tICcuL3JvdXRlcl9vdXRsZXRfY29udGV4dCc7XG5pbXBvcnQge0FjdGl2YXRlZFJvdXRlLCBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90fSBmcm9tICcuL3JvdXRlcl9zdGF0ZSc7XG5pbXBvcnQge1RyZWVOb2RlfSBmcm9tICcuL3V0aWxzL3RyZWUnO1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFJlcHJlc2VudHMgdGhlIGRldGFjaGVkIHJvdXRlIHRyZWUuXG4gKlxuICogVGhpcyBpcyBhbiBvcGFxdWUgdmFsdWUgdGhlIHJvdXRlciB3aWxsIGdpdmUgdG8gYSBjdXN0b20gcm91dGUgcmV1c2Ugc3RyYXRlZ3lcbiAqIHRvIHN0b3JlIGFuZCByZXRyaWV2ZSBsYXRlciBvbi5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCB0eXBlIERldGFjaGVkUm91dGVIYW5kbGUgPSB7fTtcblxuLyoqIEBpbnRlcm5hbCAqL1xuZXhwb3J0IHR5cGUgRGV0YWNoZWRSb3V0ZUhhbmRsZUludGVybmFsID0ge1xuICBjb250ZXh0czogTWFwPHN0cmluZywgT3V0bGV0Q29udGV4dD4sXG4gIGNvbXBvbmVudFJlZjogQ29tcG9uZW50UmVmPGFueT4sXG4gIHJvdXRlOiBUcmVlTm9kZTxBY3RpdmF0ZWRSb3V0ZT4sXG59O1xuXG4vKipcbiAqIEBkZXNjcmlwdGlvblxuICpcbiAqIFByb3ZpZGVzIGEgd2F5IHRvIGN1c3RvbWl6ZSB3aGVuIGFjdGl2YXRlZCByb3V0ZXMgZ2V0IHJldXNlZC5cbiAqXG4gKiBAcHVibGljQXBpXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBSb3V0ZVJldXNlU3RyYXRlZ3kge1xuICAvKiogRGV0ZXJtaW5lcyBpZiB0aGlzIHJvdXRlIChhbmQgaXRzIHN1YnRyZWUpIHNob3VsZCBiZSBkZXRhY2hlZCB0byBiZSByZXVzZWQgbGF0ZXIgKi9cbiAgYWJzdHJhY3Qgc2hvdWxkRGV0YWNoKHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KTogYm9vbGVhbjtcblxuICAvKipcbiAgICogU3RvcmVzIHRoZSBkZXRhY2hlZCByb3V0ZS5cbiAgICpcbiAgICogU3RvcmluZyBhIGBudWxsYCB2YWx1ZSBzaG91bGQgZXJhc2UgdGhlIHByZXZpb3VzbHkgc3RvcmVkIHZhbHVlLlxuICAgKi9cbiAgYWJzdHJhY3Qgc3RvcmUocm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsIGhhbmRsZTogRGV0YWNoZWRSb3V0ZUhhbmRsZXxudWxsKTogdm9pZDtcblxuICAvKiogRGV0ZXJtaW5lcyBpZiB0aGlzIHJvdXRlIChhbmQgaXRzIHN1YnRyZWUpIHNob3VsZCBiZSByZWF0dGFjaGVkICovXG4gIGFic3RyYWN0IHNob3VsZEF0dGFjaChyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCk6IGJvb2xlYW47XG5cbiAgLyoqIFJldHJpZXZlcyB0aGUgcHJldmlvdXNseSBzdG9yZWQgcm91dGUgKi9cbiAgYWJzdHJhY3QgcmV0cmlldmUocm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QpOiBEZXRhY2hlZFJvdXRlSGFuZGxlfG51bGw7XG5cbiAgLyoqIERldGVybWluZXMgaWYgYSByb3V0ZSBzaG91bGQgYmUgcmV1c2VkICovXG4gIGFic3RyYWN0IHNob3VsZFJldXNlUm91dGUoZnV0dXJlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBjdXJyOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KTogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBEb2VzIG5vdCBkZXRhY2ggYW55IHN1YnRyZWVzLiBSZXVzZXMgcm91dGVzIGFzIGxvbmcgYXMgdGhlaXIgcm91dGUgY29uZmlnIGlzIHRoZSBzYW1lLlxuICovXG5leHBvcnQgY2xhc3MgRGVmYXVsdFJvdXRlUmV1c2VTdHJhdGVneSBpbXBsZW1lbnRzIFJvdXRlUmV1c2VTdHJhdGVneSB7XG4gIHNob3VsZERldGFjaChyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCk6IGJvb2xlYW4geyByZXR1cm4gZmFsc2U7IH1cbiAgc3RvcmUocm91dGU6IEFjdGl2YXRlZFJvdXRlU25hcHNob3QsIGRldGFjaGVkVHJlZTogRGV0YWNoZWRSb3V0ZUhhbmRsZSk6IHZvaWQge31cbiAgc2hvdWxkQXR0YWNoKHJvdXRlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KTogYm9vbGVhbiB7IHJldHVybiBmYWxzZTsgfVxuICByZXRyaWV2ZShyb3V0ZTogQWN0aXZhdGVkUm91dGVTbmFwc2hvdCk6IERldGFjaGVkUm91dGVIYW5kbGV8bnVsbCB7IHJldHVybiBudWxsOyB9XG4gIHNob3VsZFJldXNlUm91dGUoZnV0dXJlOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90LCBjdXJyOiBBY3RpdmF0ZWRSb3V0ZVNuYXBzaG90KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIGZ1dHVyZS5yb3V0ZUNvbmZpZyA9PT0gY3Vyci5yb3V0ZUNvbmZpZztcbiAgfVxufVxuIl19