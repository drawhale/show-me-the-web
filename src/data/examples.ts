export interface Example {
  id: string
  name: string
  description: string
  html: string
  css: string
  js: string
}

export const examples: Example[] = [
  {
    id: 'variables',
    name: 'Variables & Scope',
    description: 'Understanding var, let, const and scope',
    html: `<!DOCTYPE html>
<html>
<head><title>Variables Demo</title></head>
<body>
  <h1>Variable Scope Demo</h1>
  <div id="output"></div>
</body>
</html>`,
    css: `body {
  font-family: sans-serif;
  padding: 20px;
}
h1 {
  color: #333;
}`,
    js: `// Variable declarations
var globalVar = "I'm global (var)";
let globalLet = "I'm global (let)";
const CONSTANT = "I cannot change";

// Block scope demonstration
{
  let blockScoped = "Only in this block";
  var notBlockScoped = "I escape the block!";
}

// Function scope
function testScope() {
  var functionVar = "Function scoped";
  let functionLet = "Also function scoped";
  return functionVar;
}

testScope();`
  },
  {
    id: 'closure',
    name: 'Closures',
    description: 'How closures capture variables',
    html: `<!DOCTYPE html>
<html>
<head><title>Closure Demo</title></head>
<body>
  <h1>Closure Demo</h1>
</body>
</html>`,
    css: `body { font-family: sans-serif; padding: 20px; }`,
    js: `// Closure example: Counter
function createCounter() {
  let count = 0;

  function increment() {
    count = count + 1;
    return count;
  }

  return increment;
}

// Create a counter
let counter = createCounter();

// Each call remembers 'count'
counter();
counter();
counter();`
  },
  {
    id: 'hoisting',
    name: 'Hoisting',
    description: 'Variable and function hoisting behavior',
    html: `<!DOCTYPE html>
<html>
<head><title>Hoisting Demo</title></head>
<body><h1>Hoisting Demo</h1></body>
</html>`,
    css: `body { font-family: sans-serif; padding: 20px; }`,
    js: `// Function hoisting - works!
hoistedFunction();

function hoistedFunction() {
  var message = "I was hoisted!";
  return message;
}

// var hoisting - undefined, not error
var hoistedVar = "Now I have a value";

// let/const - Temporal Dead Zone
let notHoisted = "I must be declared first";`
  },
  {
    id: 'recursion',
    name: 'Recursion',
    description: 'Recursive function calls and stack',
    html: `<!DOCTYPE html>
<html>
<head><title>Recursion Demo</title></head>
<body><h1>Recursion Demo</h1></body>
</html>`,
    css: `body { font-family: sans-serif; padding: 20px; }`,
    js: `// Factorial with recursion
function factorial(n) {
  if (n <= 1) {
    return 1;
  }
  return n * factorial(n - 1);
}

// Calculate 5!
let result = factorial(5);`
  },
  {
    id: 'loops',
    name: 'Loops',
    description: 'For and while loop execution',
    html: `<!DOCTYPE html>
<html>
<head><title>Loop Demo</title></head>
<body><h1>Loop Demo</h1></body>
</html>`,
    css: `body { font-family: sans-serif; padding: 20px; }`,
    js: `// For loop
let sum = 0;

for (let i = 1; i <= 5; i++) {
  sum = sum + i;
}

// While loop
let count = 0;
while (count < 3) {
  count = count + 1;
}`
  },
  {
    id: 'css-specificity',
    name: 'CSS Specificity',
    description: 'How CSS selectors compete',
    html: `<!DOCTYPE html>
<html>
<head><title>CSS Specificity</title></head>
<body>
  <div id="container">
    <p class="text highlight">Which color wins?</p>
  </div>
</body>
</html>`,
    css: `/* Specificity: 0-0-1 */
p {
  color: blue;
}

/* Specificity: 0-1-0 */
.text {
  color: green;
}

/* Specificity: 0-1-1 */
p.text {
  color: orange;
}

/* Specificity: 0-2-0 */
.text.highlight {
  color: purple;
}

/* Specificity: 1-0-0 */
#container p {
  color: red;
}`,
    js: `// Switch to CSS visualizer to see specificity!`
  },
  {
    id: 'css-cascade',
    name: 'CSS Cascade',
    description: 'Order and importance in CSS',
    html: `<!DOCTYPE html>
<html>
<head><title>CSS Cascade</title></head>
<body>
  <h1 class="title">Hello World</h1>
  <p class="text">This is a paragraph</p>
</body>
</html>`,
    css: `.title {
  color: blue;
  font-size: 24px;
}

/* Later rule wins for same specificity */
.title {
  color: red;
}

/* !important overrides everything */
.text {
  color: green !important;
}

.text {
  color: yellow;
}`,
    js: `// Switch to CSS visualizer to see cascade order!`
  },
  {
    id: 'objects',
    name: 'Objects & References',
    description: 'Objects stored in heap memory',
    html: `<!DOCTYPE html>
<html>
<head><title>Objects Demo</title></head>
<body><h1>Objects Demo</h1></body>
</html>`,
    css: `body { font-family: sans-serif; padding: 20px; }`,
    js: `// Object creation
let person = {
  name: "Alice",
  age: 25
};

// Array creation
let numbers = [1, 2, 3];

// Objects are references
let anotherPerson = person;`
  },
  {
    id: 'conditionals',
    name: 'Conditionals',
    description: 'If-else statement execution',
    html: `<!DOCTYPE html>
<html>
<head><title>Conditionals</title></head>
<body><h1>Conditionals Demo</h1></body>
</html>`,
    css: `body { font-family: sans-serif; padding: 20px; }`,
    js: `let score = 85;
let grade;

if (score >= 90) {
  grade = "A";
} else if (score >= 80) {
  grade = "B";
} else if (score >= 70) {
  grade = "C";
} else {
  grade = "F";
}`
  },
  {
    id: 'functions',
    name: 'Functions',
    description: 'Function declaration and execution',
    html: `<!DOCTYPE html>
<html>
<head><title>Functions</title></head>
<body><h1>Functions Demo</h1></body>
</html>`,
    css: `body { font-family: sans-serif; padding: 20px; }`,
    js: `// Function declaration
function greet(name) {
  let message = "Hello, " + name + "!";
  return message;
}

// Function call
let greeting1 = greet("Alice");
let greeting2 = greet("Bob");

// Nested function
function outer() {
  let x = 10;

  function inner() {
    return x + 5;
  }

  return inner();
}

outer();`
  }
]
