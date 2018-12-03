"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function calculateSizes(budget, compilation) {
    const calculatorMap = {
        all: AllCalculator,
        allScript: AllScriptCalculator,
        any: AnyCalculator,
        anyScript: AnyScriptCalculator,
        bundle: BundleCalculator,
        initial: InitialCalculator,
    };
    const ctor = calculatorMap[budget.type];
    const calculator = new ctor(budget, compilation);
    return calculator.calculate();
}
exports.calculateSizes = calculateSizes;
class Calculator {
    constructor(budget, compilation) {
        this.budget = budget;
        this.compilation = compilation;
    }
}
exports.Calculator = Calculator;
/**
 * A named bundle.
 */
class BundleCalculator extends Calculator {
    calculate() {
        const size = this.compilation.chunks
            .filter(chunk => chunk.name === this.budget.name)
            .reduce((files, chunk) => [...files, ...chunk.files], [])
            .map((file) => this.compilation.assets[file].size())
            .reduce((total, size) => total + size, 0);
        return [{ size, label: this.budget.name }];
    }
}
/**
 * The sum of all initial chunks (marked as initial by webpack).
 */
class InitialCalculator extends Calculator {
    calculate() {
        const initialChunks = this.compilation.chunks.filter(chunk => chunk.isOnlyInitial());
        const size = initialChunks
            .reduce((files, chunk) => [...files, ...chunk.files], [])
            .filter((file) => !file.endsWith('.map'))
            .map((file) => this.compilation.assets[file].size())
            .reduce((total, size) => total + size, 0);
        return [{ size, label: 'initial' }];
    }
}
/**
 * The sum of all the scripts portions.
 */
class AllScriptCalculator extends Calculator {
    calculate() {
        const size = Object.keys(this.compilation.assets)
            .filter(key => key.endsWith('.js'))
            .map(key => this.compilation.assets[key])
            .map(asset => asset.size())
            .reduce((total, size) => total + size, 0);
        return [{ size, label: 'total scripts' }];
    }
}
/**
 * All scripts and assets added together.
 */
class AllCalculator extends Calculator {
    calculate() {
        const size = Object.keys(this.compilation.assets)
            .filter(key => !key.endsWith('.map'))
            .map(key => this.compilation.assets[key].size())
            .reduce((total, size) => total + size, 0);
        return [{ size, label: 'total' }];
    }
}
/**
 * Any script, individually.
 */
class AnyScriptCalculator extends Calculator {
    calculate() {
        return Object.keys(this.compilation.assets)
            .filter(key => key.endsWith('.js'))
            .map(key => {
            const asset = this.compilation.assets[key];
            return {
                size: asset.size(),
                label: key,
            };
        });
    }
}
/**
 * Any script or asset (images, css, etc).
 */
class AnyCalculator extends Calculator {
    calculate() {
        return Object.keys(this.compilation.assets)
            .filter(key => !key.endsWith('.map'))
            .map(key => {
            const asset = this.compilation.assets[key];
            return {
                size: asset.size(),
                label: key,
            };
        });
    }
}
/**
 * Calculate the bytes given a string value.
 */
function calculateBytes(input, baseline, factor = 1) {
    const matches = input.match(/^\s*(\d+(?:\.\d+)?)\s*(%|(?:[mM]|[kK]|[gG])?[bB])?\s*$/);
    if (!matches) {
        return NaN;
    }
    const baselineBytes = baseline && calculateBytes(baseline) || 0;
    let value = Number(matches[1]);
    switch (matches[2] && matches[2].toLowerCase()) {
        case '%':
            value = baselineBytes * value / 100 * factor;
            break;
        case 'kb':
            value *= 1024;
            break;
        case 'mb':
            value *= 1024 * 1024;
            break;
        case 'gb':
            value *= 1024 * 1024 * 1024;
            break;
    }
    return value + baselineBytes;
}
exports.calculateBytes = calculateBytes;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVuZGxlLWNhbGN1bGF0b3IuanMiLCJzb3VyY2VSb290IjoiLi8iLCJzb3VyY2VzIjpbInBhY2thZ2VzL2FuZ3VsYXJfZGV2a2l0L2J1aWxkX2FuZ3VsYXIvc3JjL2FuZ3VsYXItY2xpLWZpbGVzL3V0aWxpdGllcy9idW5kbGUtY2FsY3VsYXRvci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQXFCQSxTQUFnQixjQUFjLENBQUMsTUFBYyxFQUFFLFdBQXdCO0lBQ3JFLE1BQU0sYUFBYSxHQUFHO1FBQ3BCLEdBQUcsRUFBRSxhQUFhO1FBQ2xCLFNBQVMsRUFBRSxtQkFBbUI7UUFDOUIsR0FBRyxFQUFFLGFBQWE7UUFDbEIsU0FBUyxFQUFFLG1CQUFtQjtRQUM5QixNQUFNLEVBQUUsZ0JBQWdCO1FBQ3hCLE9BQU8sRUFBRSxpQkFBaUI7S0FDM0IsQ0FBQztJQUNGLE1BQU0sSUFBSSxHQUFHLGFBQWEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDeEMsTUFBTSxVQUFVLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBRWpELE9BQU8sVUFBVSxDQUFDLFNBQVMsRUFBRSxDQUFDO0FBQ2hDLENBQUM7QUFiRCx3Q0FhQztBQUVELE1BQXNCLFVBQVU7SUFDOUIsWUFBdUIsTUFBYyxFQUFZLFdBQXdCO1FBQWxELFdBQU0sR0FBTixNQUFNLENBQVE7UUFBWSxnQkFBVyxHQUFYLFdBQVcsQ0FBYTtJQUFHLENBQUM7Q0FHOUU7QUFKRCxnQ0FJQztBQUVEOztHQUVHO0FBQ0gsTUFBTSxnQkFBaUIsU0FBUSxVQUFVO0lBQ3ZDLFNBQVM7UUFDUCxNQUFNLElBQUksR0FBVyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU07YUFDekMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQzthQUNoRCxNQUFNLENBQUMsQ0FBQyxLQUFLLEVB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QUM7UUFDSixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDRjtBQUVEOztHQUVHO0FBQ0gsU0FBZ0IsY0FBYyxDQUM1QixLQUFhLEVBQ2IsUUFBaUIsRUFDakIsU0FBaUIsQ0FBQztJQUVsQixNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsS0FBSyxDQUFDLHdEQUF3RCxDQUFDLENBQUM7SUFDdEYsSUFBSSxDQUFDLE9BQU8sRUFBRTtRQUNaLE9BQU8sR0FBRyxDQUFDO0tBQ1o7SUFFRCxNQUFNLGFBQWEsR0FBRyxRQUFRLElBQUksY0FBYyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUVoRSxJQUFJLEtBQUssR0FBRyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDL0IsUUFBUSxPQUFPLENBQUMsQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFdBQVcsRUFBRSxFQUFFO1FBQzlDLEtBQUssR0FBRztZQUNOLEtBQUssR0FBRyxhQUFhLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxNQUFNLENBQUM7WUFDN0MsTUFBTTtRQUNSLEtBQUssSUFBSTtZQUNQLEtBQUssSUFBSSxJQUFJLENBQUM7WUFDZCxNQUFNO1FBQ1IsS0FBSyxJQUFJO1lBQ1AsS0FBSyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUM7WUFDckIsTUFBTTtRQUNSLEtBQUssSUFBSTtZQUNQLEtBQUssSUFBSSxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksQ0FBQztZQUM1QixNQUFNO0tBQ1Q7SUFFRCxPQUFPLEtBQUssR0FBRyxhQUFhLENBQUM7QUFDL0IsQ0FBQztBQTdCRCx3Q0E2QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgeyBCdWRnZXQgfSBmcm9tICcuLi8uLi9icm93c2VyL3NjaGVtYSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29tcGlsYXRpb24ge1xuICBhc3NldHM6IHsgW25hbWU6IHN0cmluZ106IHsgc2l6ZTogKCkgPT4gbnVtYmVyIH0gfTtcbiAgY2h1bmtzOiB7IG5hbWU6IHN0cmluZywgZmlsZXM6IHN0cmluZ1tdLCBpc09ubHlJbml0aWFsOiAoKSA9PiBib29sZWFuIH1bXTtcbiAgd2FybmluZ3M6IHN0cmluZ1tdO1xuICBlcnJvcnM6IHN0cmluZ1tdO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNpemUge1xuICBzaXplOiBudW1iZXI7XG4gIGxhYmVsPzogc3RyaW5nO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlU2l6ZXMoYnVkZ2V0OiBCdWRnZXQsIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbik6IFNpemVbXSB7XG4gIGNvbnN0IGNhbGN1bGF0b3JNYXAgPSB7XG4gICAgYWxsOiBBbGxDYWxjdWxhdG9yLFxuICAgIGFsbFNjcmlwdDogQWxsU2NyaXB0Q2FsY3VsYXRvcixcbiAgICBhbnk6IEFueUNhbGN1bGF0b3IsXG4gICAgYW55U2NyaXB0OiBBbnlTY3JpcHRDYWxjdWxhdG9yLFxuICAgIGJ1bmRsZTogQnVuZGxlQ2FsY3VsYXRvcixcbiAgICBpbml0aWFsOiBJbml0aWFsQ2FsY3VsYXRvcixcbiAgfTtcbiAgY29uc3QgY3RvciA9IGNhbGN1bGF0b3JNYXBbYnVkZ2V0LnR5cGVdO1xuICBjb25zdCBjYWxjdWxhdG9yID0gbmV3IGN0b3IoYnVkZ2V0LCBjb21waWxhdGlvbik7XG5cbiAgcmV0dXJuIGNhbGN1bGF0b3IuY2FsY3VsYXRlKCk7XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBDYWxjdWxhdG9yIHtcbiAgY29uc3RydWN0b3IgKHByb3RlY3RlZCBidWRnZXQ6IEJ1ZGdldCwgcHJvdGVjdGVkIGNvbXBpbGF0aW9uOiBDb21waWxhdGlvbikge31cblxuICBhYnN0cmFjdCBjYWxjdWxhdGUoKTogU2l6ZVtdO1xufVxuXG4vKipcbiAqIEEgbmFtZWQgYnVuZGxlLlxuICovXG5jbGFzcyBCdW5kbGVDYWxjdWxhdG9yIGV4dGVuZHMgQ2FsY3VsYXRvciB7XG4gIGNhbGN1bGF0ZSgpIHtcbiAgICBjb25zdCBzaXplOiBudW1iZXIgPSB0aGlzLmNvbXBpbGF0aW9uLmNodW5rc1xuICAgICAgLmZpbHRlcihjaHVuayA9PiBjaHVuay5uYW1lID09PSB0aGlzLmJ1ZGdldC5uYW1lKVxuICAgICAgLnJlZHVjZSgoZmlsZXMsIGNodW5rKSA9PiBbLi4uZmlsZXMsIC4uLmNodW5rLmZpbGVzXSwgW10pXG4gICAgICAubWFwKChmaWxlOiBzdHJpbmcpID0+IHRoaXMuY29tcGlsYXRpb24uYXNzZXRzW2ZpbGVdLnNpemUoKSlcbiAgICAgIC5yZWR1Y2UoKHRvdGFsOiBudW1iZXIsIHNpemU6IG51bWJlcikgPT4gdG90YWwgKyBzaXplLCAwKTtcblxuICAgIHJldHVybiBbe3NpemUsIGxhYmVsOiB0aGlzLmJ1ZGdldC5uYW1lfV07XG4gIH1cbn1cblxuLyoqXG4gKiBUaGUgc3VtIG9mIGFsbCBpbml0aWFsIGNodW5rcyAobWFya2VkIGFzIGluaXRpYWwgYnkgd2VicGFjaykuXG4gKi9cbmNsYXNzIEluaXRpYWxDYWxjdWxhdG9yIGV4dGVuZHMgQ2FsY3VsYXRvciB7XG4gIGNhbGN1bGF0ZSgpIHtcbiAgICBjb25zdCBpbml0aWFsQ2h1bmtzID0gdGhpcy5jb21waWxhdGlvbi5jaHVua3MuZmlsdGVyKGNodW5rID0+IGNodW5rLmlzT25seUluaXRpYWwoKSk7XG4gICAgY29uc3Qgc2l6ZTogbnVtYmVyID0gaW5pdGlhbENodW5rc1xuICAgICAgLnJlZHVjZSgoZmlsZXMsIGNodW5rKSA9PiBbLi4uZmlsZXMsIC4uLmNodW5rLmZpbGVzXSwgW10pXG4gICAgICAuZmlsdGVyKChmaWxlOiBzdHJpbmcpID0+ICFmaWxlLmVuZHNXaXRoKCcubWFwJykpXG4gICAgICAubWFwKChmaWxlOiBzdHJpbmcpID0+IHRoaXMuY29tcGlsYXRpb24uYXNzZXRzW2ZpbGVdLnNpemUoKSlcbiAgICAgIC5yZWR1Y2UoKHRvdGFsOiBudW1iZXIsIHNpemU6IG51bWJlcikgPT4gdG90YWwgKyBzaXplLCAwKTtcblxuICAgIHJldHVybiBbe3NpemUsIGxhYmVsOiAnaW5pdGlhbCd9XTtcbiAgfVxufVxuXG4vKipcbiAqIFRoZSBzdW0gb2YgYWxsIHRoZSBzY3JpcHRzIHBvcnRpb25zLlxuICovXG5jbGFzcyBBbGxTY3JpcHRDYWxjdWxhdG9yIGV4dGVuZHMgQ2FsY3VsYXRvciB7XG4gIGNhbGN1bGF0ZSgpIHtcbiAgICBjb25zdCBzaXplOiBudW1iZXIgPSBPYmplY3Qua2V5cyh0aGlzLmNvbXBpbGF0aW9uLmFzc2V0cylcbiAgICAgIC5maWx0ZXIoa2V5ID0+IGtleS5lbmRzV2l0aCgnLmpzJykpXG4gICAgICAubWFwKGtleSA9PiB0aGlzLmNvbXBpbGF0aW9uLmFzc2V0c1trZXldKVxuICAgICAgLm1hcChhc3NldCA9PiBhc3NldC5zaXplKCkpXG4gICAgICAucmVkdWNlKCh0b3RhbDogbnVtYmVyLCBzaXplOiBudW1iZXIpID0+IHRvdGFsICsgc2l6ZSwgMCk7XG5cbiAgICByZXR1cm4gW3tzaXplLCBsYWJlbDogJ3RvdGFsIHNjcmlwdHMnfV07XG4gIH1cbn1cblxuLyoqXG4gKiBBbGwgc2NyaXB0cyBhbmQgYXNzZXRzIGFkZGVkIHRvZ2V0aGVyLlxuICovXG5jbGFzcyBBbGxDYWxjdWxhdG9yIGV4dGVuZHMgQ2FsY3VsYXRvciB7XG4gIGNhbGN1bGF0ZSgpIHtcbiAgICBjb25zdCBzaXplOiBudW1iZXIgPSBPYmplY3Qua2V5cyh0aGlzLmNvbXBpbGF0aW9uLmFzc2V0cylcbiAgICAgIC5maWx0ZXIoa2V5ID0+ICFrZXkuZW5kc1dpdGgoJy5tYXAnKSlcbiAgICAgIC5tYXAoa2V5ID0+IHRoaXMuY29tcGlsYXRpb24uYXNzZXRzW2tleV0uc2l6ZSgpKVxuICAgICAgLnJlZHVjZSgodG90YWw6IG51bWJlciwgc2l6ZTogbnVtYmVyKSA9PiB0b3RhbCArIHNpemUsIDApO1xuXG4gICAgcmV0dXJuIFt7c2l6ZSwgbGFiZWw6ICd0b3RhbCd9XTtcbiAgfVxufVxuXG4vKipcbiAqIEFueSBzY3JpcHQsIGluZGl2aWR1YWxseS5cbiAqL1xuY2xhc3MgQW55U2NyaXB0Q2FsY3VsYXRvciBleHRlbmRzIENhbGN1bGF0b3Ige1xuICBjYWxjdWxhdGUoKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuY29tcGlsYXRpb24uYXNzZXRzKVxuICAgICAgLmZpbHRlcihrZXkgPT4ga2V5LmVuZHNXaXRoKCcuanMnKSlcbiAgICAgIC5tYXAoa2V5ID0+IHtcbiAgICAgICAgY29uc3QgYXNzZXQgPSB0aGlzLmNvbXBpbGF0aW9uLmFzc2V0c1trZXldO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgc2l6ZTogYXNzZXQuc2l6ZSgpLFxuICAgICAgICAgIGxhYmVsOiBrZXksXG4gICAgICAgIH07XG4gICAgICB9KTtcbiAgfVxufVxuXG4vKipcbiAqIEFueSBzY3JpcHQgb3IgYXNzZXQgKGltYWdlcywgY3NzLCBldGMpLlxuICovXG5jbGFzcyBBbnlDYWxjdWxhdG9yIGV4dGVuZHMgQ2FsY3VsYXRvciB7XG4gIGNhbGN1bGF0ZSgpIHtcbiAgICByZXR1cm4gT2JqZWN0LmtleXModGhpcy5jb21waWxhdGlvbi5hc3NldHMpXG4gICAgICAuZmlsdGVyKGtleSA9PiAha2V5LmVuZHNXaXRoKCcubWFwJykpXG4gICAgICAubWFwKGtleSA9PiB7XG4gICAgICAgIGNvbnN0IGFzc2V0ID0gdGhpcy5jb21waWxhdGlvbi5hc3NldHNba2V5XTtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHNpemU6IGFzc2V0LnNpemUoKSxcbiAgICAgICAgICBsYWJlbDoga2V5LFxuICAgICAgICB9O1xuICAgICAgfSk7XG4gIH1cbn1cblxuLyoqXG4gKiBDYWxjdWxhdGUgdGhlIGJ5dGVzIGdpdmVuIGEgc3RyaW5nIHZhbHVlLlxuICovXG5leHBvcnQgZnVuY3Rpb24gY2FsY3VsYXRlQnl0ZXMoXG4gIGlucHV0OiBzdHJpbmcsXG4gIGJhc2VsaW5lPzogc3RyaW5nLFxuICBmYWN0b3I6IDEgfCAtMSA9IDEsXG4pOiBudW1iZXIge1xuICBjb25zdCBtYXRjaGVzID0gaW5wdXQubWF0Y2goL15cXHMqKFxcZCsoPzpcXC5cXGQrKT8pXFxzKiglfCg/OlttTV18W2tLXXxbZ0ddKT9bYkJdKT9cXHMqJC8pO1xuICBpZiAoIW1hdGNoZXMpIHtcbiAgICByZXR1cm4gTmFOO1xuICB9XG5cbiAgY29uc3QgYmFzZWxpbmVCeXRlcyA9IGJhc2VsaW5lICYmIGNhbGN1bGF0ZUJ5dGVzKGJhc2VsaW5lKSB8fCAwO1xuXG4gIGxldCB2YWx1ZSA9IE51bWJlcihtYXRjaGVzWzFdKTtcbiAgc3dpdGNoIChtYXRjaGVzWzJdICYmIG1hdGNoZXNbMl0udG9Mb3dlckNhc2UoKSkge1xuICAgIGNhc2UgJyUnOlxuICAgICAgdmFsdWUgPSBiYXNlbGluZUJ5dGVzICogdmFsdWUgLyAxMDAgKiBmYWN0b3I7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdrYic6XG4gICAgICB2YWx1ZSAqPSAxMDI0O1xuICAgICAgYnJlYWs7XG4gICAgY2FzZSAnbWInOlxuICAgICAgdmFsdWUgKj0gMTAyNCAqIDEwMjQ7XG4gICAgICBicmVhaztcbiAgICBjYXNlICdnYic6XG4gICAgICB2YWx1ZSAqPSAxMDI0ICogMTAyNCAqIDEwMjQ7XG4gICAgICBicmVhaztcbiAgfVxuXG4gIHJldHVybiB2YWx1ZSArIGJhc2VsaW5lQnl0ZXM7XG59XG4iXX0=