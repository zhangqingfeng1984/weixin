var b1 = new Buffer('sam');
var b2 = new Buffer(2)
console.log(b1.toString())
console.log(b2.toString())
var b3 = Buffer.concat([b1, b2])
console.log(b3.toString())