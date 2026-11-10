const display = document.querySelector("#display");
const expression = document.querySelector("#expression");
const keypad = document.querySelector(".keypad");
const themeToggle = document.querySelector("#themeToggle");

let currentValue = "0";
let storedValue = null;
let pendingOperator = null;
let shouldResetDisplay = false;
let expressionText = "";

function render() {
  display.textContent = currentValue;
  expression.textContent = expressionText;
}

function formatNumber(value) {
  if (!Number.isFinite(value)) return "Error";
  // Keep useful precision without showing floating-point artefacts.
  const rounded = Number.parseFloat(value.toPrecision(11));
  return String(rounded);
}

function inputDigit(digit) {
  if (currentValue === "Error" || shouldResetDisplay) {
    currentValue = digit;
    shouldResetDisplay = false;
  } else if (currentValue === "0") {
    currentValue = digit;
  } else if (currentValue.replace("-", "").length < 14) {
    currentValue += digit;
  }
  render();
}

function inputDecimal() {
  if (currentValue === "Error" || shouldResetDisplay) {
    currentValue = "0.";
    shouldResetDisplay = false;
  } else if (!currentValue.includes(".")) {
    currentValue += ".";
  }
  render();
}

function clearAll() {
  currentValue = "0";
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = false;
  expressionText = "";
  render();
}

function backspace() {
  if (currentValue === "Error" || shouldResetDisplay) {
    currentValue = "0";
    shouldResetDisplay = false;
  } else {
    currentValue = currentValue.length > 1 ? currentValue.slice(0, -1) : "0";
    if (currentValue === "-") currentValue = "0";
  }
  render();
}

function toggleSign() {
  if (currentValue === "0" || currentValue === "Error") return;
  currentValue = currentValue.startsWith("-") ? currentValue.slice(1) : `-${currentValue}`;
  render();
}

function percentage() {
  if (currentValue === "Error") return;
  currentValue = formatNumber(Number(currentValue) / 100);
  render();
}

function calculate(left, right, operator) {
  switch (operator) {
    case "+": return left + right;
    case "−": return left - right;
    case "×": return left * right;
    case "÷": return right === 0 ? NaN : left / right;
    default: return right;
  }
}

function chooseOperator(operator) {
  if (currentValue === "Error") return;
  const inputValue = Number(currentValue);

  if (pendingOperator && !shouldResetDisplay) {
    const result = calculate(storedValue, inputValue, pendingOperator);
    currentValue = formatNumber(result);
    storedValue = result;
  } else {
    storedValue = inputValue;
  }

  pendingOperator = operator;
  expressionText = `${formatNumber(storedValue)} ${operator}`;
  shouldResetDisplay = true;
  render();
}

function equals() {
  if (!pendingOperator || storedValue === null || currentValue === "Error") return;
  const left = storedValue;
  const right = Number(currentValue);
  const result = calculate(left, right, pendingOperator);
  expressionText = `${formatNumber(left)} ${pendingOperator} ${formatNumber(right)} =`;
  currentValue = formatNumber(result);
  storedValue = null;
  pendingOperator = null;
  shouldResetDisplay = true;
  render();
}

function handleAction(action) {
  switch (action) {
    case "clear": clearAll(); break;
    case "backspace": backspace(); break;
    case "decimal": inputDecimal(); break;
    case "sign": toggleSign(); break;
    case "percent": percentage(); break;
    case "equals": equals(); break;
  }
}

keypad.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  if (button.dataset.number !== undefined) inputDigit(button.dataset.number);
  if (button.dataset.operator) chooseOperator(button.dataset.operator);
  if (button.dataset.action) handleAction(button.dataset.action);
});

function handleKeyboard(event) {
  // Do not intercept browser shortcuts or keys while focus is on another control.
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  const key = event.key;

  if (/^[0-9]$/.test(key)) {
    event.preventDefault();
    inputDigit(key);
  } else if (key === "." || key === ",") {
    event.preventDefault();
    inputDecimal();
  } else if (key === "+") {
    event.preventDefault();
    chooseOperator("+");
  } else if (key === "-") {
    event.preventDefault();
    chooseOperator("−");
  } else if (key === "*") {
    event.preventDefault();
    chooseOperator("×");
  } else if (key === "/") {
    event.preventDefault();
    chooseOperator("÷");
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    equals();
  } else if (key === "Backspace") {
    event.preventDefault();
    backspace();
  } else if (key === "Escape") {
    clearAll();
  } else if (key === "%") {
    percentage();
  }
}
document.addEventListener("keydown", handleKeyboard);

// Restore the user's theme preference when available.
const savedTheme = localStorage.getItem("calc-theme");
if (savedTheme === "light") document.documentElement.dataset.theme = "light";
themeToggle.addEventListener("click", () => {
  const isLight = document.documentElement.dataset.theme === "light";
  const nextTheme = isLight ? "dark" : "light";
  if (nextTheme === "light") document.documentElement.dataset.theme = "light";
  else delete document.documentElement.dataset.theme;
  localStorage.setItem("calc-theme", nextTheme);
  themeToggle.setAttribute("aria-label", nextTheme === "light" ? "Switch to dark theme" : "Switch to light theme");
});

render();
