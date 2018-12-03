"use strict";
/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
function default_1(content, map) {
    const stringifiedContent = JSON.stringify(content);
    const stringifiedMap = map ? JSON.stringify(map) : `''`;
    return `module.exports = [[module.id, ${stringifiedContent}, '', ${stringifiedMap}]]`;
}
exports.default = default_1;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF3LWNzcy1sb2FkZXIuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2FuZ3VsYXItY2xpLWZpbGVzL3BsdWdpbnMvcmF3LWNzcy1sb2FkZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7QUFFSCxtQkFBd0IsT0FBZSxFQUFFLEdBQVc7SUFDbEQsTUFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ25ELE1BQU0sY0FBYyxHQUFHLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBRXhELE9BQU8saUNBQWlDLGtCQUFrQixTQUFTLGNBQWMsSUFBSSxDQUFDO0FBQ3hGLENBQUM7QUFMRCw0QkFLQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24oY29udGVudDogc3RyaW5nLCBtYXA6IG9iamVjdCkge1xuICBjb25zdCBzdHJpbmdpZmllZENvbnRlbnQgPSBKU09OLnN0cmluZ2lmeShjb250ZW50KTtcbiAgY29uc3Qgc3RyaW5naWZpZWRNYXAgPSBtYXAgPyBKU09OLnN0cmluZ2lmeShtYXApIDogYCcnYDtcblxuICByZXR1cm4gYG1vZHVsZS5leHBvcnRzID0gW1ttb2R1bGUuaWQsICR7c3RyaW5naWZpZWRDb250ZW50fSwgJycsICR7c3RyaW5naWZpZWRNYXB9XV1gO1xufVxuIl19