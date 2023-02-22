const obj = {}

console.time('setup')
for (let i = 0; i < 4500000; i++) {
	obj[i] = i
}
console.timeEnd('setup')

console.time('entries')
const entries = Object.entries(obj)
console.timeEnd('entries')

console.time('sort')
entries.sort((a, b) => b[1] - a[1])
console.timeEnd('sort')
