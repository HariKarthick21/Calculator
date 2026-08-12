import { useState, useEffect } from "react";
import Display from "./Display";
import Button from "./Button";

function Calculator() {
    const [display, setDisplay] = useState("0");
    const [expression, setExpression] = useState("");
    const [tokens, setTokens] = useState([]);
    const [waitingForNumber, setWaitingForNumber] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [addMode, setAddMode] = useState(false);
    const [angleMode, setAngleMode] = useState("DEG");
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState(() => {
        try {
            const savedHistory = localStorage.getItem("calculatorHistory");
            return savedHistory ? JSON.parse(savedHistory) : [];
        } catch (error) {
            console.error("Unable to load history:", error);
            return [];
        }
    });

    const API_URL = import.meta.env.VITE_API_URL;

    const handleNumber = (number) => {
        if (waitingForNumber && tokens.length === 0) {
            setDisplay(number);
            setExpression("");
            setWaitingForNumber(false);
            return;
        }
        if (waitingForNumber) {
            setDisplay(number);
            setWaitingForNumber(false);
            return;
        }
        if (display === "0") {
            setDisplay(number);
        } else {
            setDisplay(display + number);
        }
    };

    const handleDecimal = () => {
        if (waitingForNumber) {
            setDisplay("0.");
            setWaitingForNumber(false);
            return;
        }
        if (!display.includes(".")) {
            setDisplay(display + ".");
        }
    };

    const updateExpressionDisplay = (newTokens) => {
        setExpression(newTokens.join(" "));
    };

    const handleOperator = (selectedOperator) => {
        let newTokens = [...tokens];
        if (waitingForNumber && tokens.length === 0 && display !== "0") {
            newTokens.push(display);
        } else if (!waitingForNumber && display !== "") {
            if (newTokens.length === 0 || newTokens[newTokens.length - 1] !== ")") {
                newTokens.push(display);
            }
        }
        if (newTokens.length > 0 && ["+", "-", "×", "÷", "^"].includes(newTokens[newTokens.length - 1])) {
            newTokens[newTokens.length - 1] = selectedOperator;
        } else {
            newTokens.push(selectedOperator);
        }
        setTokens(newTokens);
        updateExpressionDisplay(newTokens);
        setDisplay("0");
        setWaitingForNumber(true);
    };

    const handleParenthesis = (parenthesis) => {
        let newTokens = [...tokens];
        if (parenthesis === "(") {
            if (!waitingForNumber && display !== "0") {
                newTokens.push(display);
                newTokens.push("×");
            }
            newTokens.push("(");
            setTokens(newTokens);
            updateExpressionDisplay(newTokens);
            setDisplay("0");
            setWaitingForNumber(true);
            return;
        }
        if (parenthesis === ")") {
            const openCount = newTokens.filter((token) => token === "(").length;
            const closeCount = newTokens.filter((token) => token === ")").length;
            if (openCount <= closeCount) {
                return;
            }
            const lastToken = newTokens[newTokens.length - 1];
            if (["+", "-", "×", "÷", "^", "("].includes(lastToken)) {
                return;
            }
            if (!waitingForNumber && display !== "0") {
                newTokens.push(display);
            }
            newTokens.push(")");
            setTokens(newTokens);
            updateExpressionDisplay(newTokens);
            setDisplay("0");
            setWaitingForNumber(true);
        }
    };

    const handleAllClear = () => {
        setDisplay("0");
        setExpression("");
        setTokens([]);
        setWaitingForNumber(false);
        setErrorMessage("");
    };

    const handleClear = () => {
        setDisplay("0");
    };

    const handleBackspace = () => {
        if (waitingForNumber) {
            return;
        }
        if (display.length <= 1) {
            setDisplay("0");
            return;
        }
        setDisplay(display.slice(0, -1));
    };

    const addToHistory = (historyExpression, result) => {
        const newHistoryItem = {
            id: Date.now(),
            expression: historyExpression,
            result: String(result),
            date: new Date().toLocaleString()
        };
        setHistory((prevHistory) => {
            const updatedHistory = [newHistoryItem, ...prevHistory];
            localStorage.setItem("calculatorHistory", JSON.stringify(updatedHistory));
            return updatedHistory;
        });
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("calculatorHistory");
    };

    const useHistoryResult = (result) => {
        setDisplay(String(result));
        setExpression("");
        setTokens([]);
        setWaitingForNumber(true);
        setShowHistory(false);
    };

    const getOperationSymbol = (operation) => {
        const symbols = {
            percentage: "%",
            reciprocal: "1/x",
            square: "x²",
            cube: "x³",
            sqrt: "√x",
            cbrt: "∛x"
        };
        return symbols[operation] || operation;
    };

    const calculateUnaryOperation = async (operation) => {
        const number = parseFloat(display);
        if (isNaN(number)) {
            return;
        }
        setErrorMessage("");
        try {
            const response = await fetch(`${API_URL}/api/calculate/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    first_number: number,
                    operation: operation,
                    second_number: null
                })
            });
            const data = await response.json();
            if (!response.ok) {
                setErrorMessage(data.error || "Calculation error.");
                return;
            }
            const historyExpression = `${display} ${getOperationSymbol(operation)}`;
            addToHistory(historyExpression, data.result);
            setExpression(historyExpression);
            setDisplay(String(data.result));
            setWaitingForNumber(true);
        } catch (error) {
            console.error("API Error:", error);
            setErrorMessage("Unable to connect to calculator server.");
        }
    };

    const calculateExpressionWithBackend = async () => {
        let finalTokens = [...tokens];
        if (!waitingForNumber && display !== "") {
            if (finalTokens.length === 0 || finalTokens[finalTokens.length - 1] !== ")") {
                finalTokens.push(display);
            }
        }
        if (finalTokens.length === 0 && display !== "") {
            finalTokens.push(display);
        }
        const lastToken = finalTokens[finalTokens.length - 1];
        if (["+", "-", "×", "÷", "^"].includes(lastToken)) {
            finalTokens.pop();
        }
        if (finalTokens.length === 0) {
            return;
        }
        const openCount = finalTokens.filter((token) => token === "(").length;
        const closeCount = finalTokens.filter((token) => token === ")").length;
        if (openCount !== closeCount) {
            setErrorMessage("Parentheses are not balanced.");
            return;
        }
        const backendExpression = finalTokens.map((token) => {
            if (token === "×") {
                return "*";
            }
            if (token === "÷") {
                return "/";
            }
            if (token === "^") {
                return "**";
            }
            return token;
        }).join("");
        setErrorMessage("");
        try {
            const response = await fetch(`${API_URL}/api/calculate-expression/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    expression: backendExpression
                })
            });
            const data = await response.json();
            if (!response.ok) {
                setErrorMessage(data.error || "Calculation error.");
                return;
            }
            const historyExpression = finalTokens.join(" ");
            addToHistory(historyExpression, data.result);
            setExpression(historyExpression + " =");
            setDisplay(String(data.result));
            setTokens([]);
            setWaitingForNumber(true);
        } catch (error) {
            console.error("Expression API Error:", error);
            setErrorMessage("Unable to connect to calculator server.");
        }
    };

    const openAddMode = () => {
        setAddMode(true);
    };

    const closeAddMode = () => {
        setAddMode(false);
    };

    const setDegreeMode = () => {
        setAngleMode("DEG");
    };

    const setRadianMode = () => {
        setAngleMode("RAD");
    };

    const handleAddOperation = async (operation) => {
        const number = parseFloat(display);
        if (isNaN(number)) {
            return;
        }
        setErrorMessage("");
        try {
            const response = await fetch(`${API_URL}/api/add-operation/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    number: number,
                    operation: operation,
                    angle_mode: angleMode
                })
            });
            const data = await response.json();
            if (!response.ok) {
                setErrorMessage(data.error || "Calculation error.");
                return;
            }
            const historyExpression = `${getAddSymbol(operation)}(${display})`;
            addToHistory(historyExpression, data.result);
            setExpression(historyExpression);
            setDisplay(String(data.result));
            setWaitingForNumber(true);
        } catch (error) {
            console.error("ADD API Error:", error);
            setErrorMessage("Unable to connect to calculator server.");
        }
    };

    const getAddSymbol = (operation) => {
        const symbols = {
            sin: "sin",
            cos: "cos",
            tan: "tan",
            log: "log",
            pi: "π",
            exp: "exp",
            abs: "|x|",
            factorial: "n!",
            dec: "DEC",
            bin: "BIN",
            oct: "OCT",
            hex: "HEX",
            power: "^"
        };
        return symbols[operation] || operation;
    };

    const handleClick = (value) => {
        if (errorMessage) {
            setErrorMessage("");
        }
        if (value === "ADD") {
            openAddMode();
            return;
        }
        if (/^[0-9]$/.test(value)) {
            handleNumber(value);
            return;
        }
        if (value === ".") {
            handleDecimal();
            return;
        }
        if (value === "+" || value === "-" || value === "×" || value === "÷" || value === "^") {
            handleOperator(value);
            return;
        }
        if (value === "(" || value === ")") {
            handleParenthesis(value);
            return;
        }
        if (value === "AC") {
            handleAllClear();
            return;
        }
        if (value === "C") {
            handleClear();
            return;
        }
        if (value === "⌫") {
            handleBackspace();
            return;
        }
        if (value === "%") {
            calculateUnaryOperation("percentage");
            return;
        }
        if (value === "1/x") {
            calculateUnaryOperation("reciprocal");
            return;
        }
        if (value === "x²") {
            calculateUnaryOperation("square");
            return;
        }
        if (value === "x³") {
            calculateUnaryOperation("cube");
            return;
        }
        if (value === "sqrt") {
            calculateUnaryOperation("sqrt");
            return;
        }
        if (value === "cbrt") {
            calculateUnaryOperation("cbrt");
            return;
        }
        if (value === "=") {
            calculateExpressionWithBackend();
        }
    };

    useEffect(() => {
        const handleKeyboard = (event) => {
            const key = event.key;
            if (/^[0-9]$/.test(key)) {
                event.preventDefault();
                handleClick(key);
                return;
            }
            if (key === "." || key === ",") {
                event.preventDefault();
                handleClick(".");
                return;
            }
            if (key === "+") {
                event.preventDefault();
                handleClick("+");
                return;
            }
            if (key === "-") {
                event.preventDefault();
                handleClick("-");
                return;
            }
            if (key === "*" || key === "x" || key === "X") {
                event.preventDefault();
                handleClick("×");
                return;
            }
            if (key === "/") {
                event.preventDefault();
                handleClick("÷");
                return;
            }
            if (key === "^") {
                event.preventDefault();
                handleClick("^");
                return;
            }
            if (key === "(" || key === ")") {
                event.preventDefault();
                handleClick(key);
                return;
            }
            if (key === "%") {
                event.preventDefault();
                handleClick("%");
                return;
            }
            if (key === "Enter" || key === "=") {
                event.preventDefault();
                handleClick("=");
                return;
            }
            if (key === "Backspace") {
                event.preventDefault();
                handleClick("⌫");
                return;
            }
            if (key === "Escape") {
                event.preventDefault();
                if (showHistory) {
                    setShowHistory(false);
                } else if (showShortcuts) {
                    setShowShortcuts(false);
                } else if (addMode) {
                    closeAddMode();
                } else {
                    handleClick("AC");
                }
                return;
            }
            if (key === "Delete") {
                event.preventDefault();
                handleClick("C");
                return;
            }
            if (key.toLowerCase() === "a") {
                event.preventDefault();
                openAddMode();
                return;
            }
            if (key.toLowerCase() === "h") {
                event.preventDefault();
                setShowHistory(true);
            }
        };
        window.addEventListener("keydown", handleKeyboard);
        return () => {
            window.removeEventListener("keydown", handleKeyboard);
        };
    }, [display, expression, tokens, waitingForNumber, addMode, errorMessage, showHistory, showShortcuts]);

    const ErrorPopup = () => {
        if (!errorMessage) {
            return null;
        }
        return (
            <div className="error-overlay">
                <div className="error-popup">
                    <div className="error-icon">!</div>
                    <h3>Calculation Error</h3>
                    <p>{errorMessage}</p>
                    <button className="error-button" onClick={() => setErrorMessage("")}>OK</button>
                </div>
            </div>
        );
    };

    return (
        <>
            <ErrorPopup />
            <div className={addMode ? "calculator add-calculator" : "calculator"}>
                <button className="shortcut-eye" onClick={() => setShowShortcuts(true)} title="Keyboard shortcuts">👁</button>
                <button className="history-button" onClick={() => setShowHistory(true)} title="Calculation history">📜</button>
                <Display expression={expression} value={display} />
                {addMode ? (
                    <div className="add-panel">
                        <div className="add-top-row">
                            <Button className="add-back" onClick={closeAddMode}>←</Button>
                            <div className="angle-row">
                                <button className={angleMode === "DEG" ? "angle active" : "angle"} onClick={setDegreeMode}>DEG</button>
                                <button className={angleMode === "RAD" ? "angle active" : "angle"} onClick={setRadianMode}>RAD</button>
                            </div>
                        </div>
                        <div className="add-grid">
                            <Button className="special" onClick={() => handleAddOperation("sin")}>SIN</Button>
                            <Button className="special" onClick={() => handleAddOperation("cos")}>COS</Button>
                            <Button className="special" onClick={() => handleAddOperation("tan")}>TAN</Button>
                            <Button className="special" onClick={() => handleAddOperation("log")}>LOG</Button>
                            <Button className="special" onClick={() => handleAddOperation("pi")}>π</Button>
                            <Button className="special" onClick={() => handleAddOperation("exp")}>EXP</Button>
                            <Button className="special" onClick={() => handleAddOperation("abs")}>|x|</Button>
                            <Button className="special" onClick={() => handleAddOperation("factorial")}>n!</Button>
                            <Button className="special" onClick={() => handleAddOperation("dec")}>DEC</Button>
                            <Button className="special" onClick={() => handleAddOperation("bin")}>BIN</Button>
                            <Button className="special" onClick={() => handleAddOperation("oct")}>OCT</Button>
                            <Button className="special" onClick={() => handleAddOperation("hex")}>HEX</Button>
                            <Button className="special" onClick={() => handleClick("^")}>^</Button>
                        </div>
                    </div>
                ) : (
                    <div className="button-grid">
                        <Button className="add" onClick={() => handleClick("ADD")}>ADD</Button>
                        <Button className="clear" onClick={() => handleClick("AC")}>AC</Button>
                        <Button className="clear-current" onClick={() => handleClick("C")}>C</Button>
                        <Button className="backspace" onClick={() => handleClick("⌫")}>⌫</Button>
                        <Button className="special" onClick={() => handleClick("%")}>%</Button>
                        <Button className="special" onClick={() => handleClick("1/x")}>1/x</Button>
                        <Button className="special" onClick={() => handleClick("x²")}>x²</Button>
                        <Button className="special" onClick={() => handleClick("x³")}>x³</Button>
                        <Button className="special" onClick={() => handleClick("sqrt")}>√x</Button>
                        <Button className="special" onClick={() => handleClick("cbrt")}>∛x</Button>
                        <Button className="special" onClick={() => handleClick("(")}>(</Button>
                        <Button className="special" onClick={() => handleClick(")")}> )</Button>
                        <Button onClick={() => handleClick("7")}>7</Button>
                        <Button onClick={() => handleClick("8")}>8</Button>
                        <Button onClick={() => handleClick("9")}>9</Button>
                        <Button className="operator" onClick={() => handleClick("÷")}>÷</Button>
                        <Button onClick={() => handleClick("4")}>4</Button>
                        <Button onClick={() => handleClick("5")}>5</Button>
                        <Button onClick={() => handleClick("6")}>6</Button>
                        <Button className="operator" onClick={() => handleClick("×")}>×</Button>
                        <Button onClick={() => handleClick("1")}>1</Button>
                        <Button onClick={() => handleClick("2")}>2</Button>
                        <Button onClick={() => handleClick("3")}>3</Button>
                        <Button className="operator" onClick={() => handleClick("-")}>−</Button>
                        <Button onClick={() => handleClick(".")}>.</Button>
                        <Button onClick={() => handleClick("0")}>0</Button>
                        <Button className="equals" onClick={() => handleClick("=")}>=</Button>
                        <Button className="operator" onClick={() => handleClick("+")}>+</Button>
                    </div>
                )}
            </div>
            {showShortcuts && (
                <div className="shortcut-overlay">
                    <div className="shortcut-popup">
                        <div className="shortcut-header">
                            <h2>Keyboard Shortcuts</h2>
                            <button className="shortcut-close" onClick={() => setShowShortcuts(false)}>×</button>
                        </div>
                        <div className="shortcut-list">
                            <div><span>0–9</span><strong>Numbers</strong></div>
                            <div><span>. ,</span><strong>Decimal</strong></div>
                            <div><span>+</span><strong>Addition</strong></div>
                            <div><span>-</span><strong>Subtraction</strong></div>
                            <div><span>x X *</span><strong>Multiplication</strong></div>
                            <div><span>/</span><strong>Division</strong></div>
                            <div><span>^</span><strong>Power</strong></div>
                            <div><span>( )</span><strong>Parentheses</strong></div>
                            <div><span>%</span><strong>Percentage</strong></div>
                            <div className="shortcut-space"></div>
                            <div><span>Enter =</span><strong>Equals</strong></div>
                            <div><span>Backspace</span><strong>⌫</strong></div>
                            <div><span>Escape</span><strong>Back / AC</strong></div>
                            <div><span>Delete</span><strong>C</strong></div>
                            <div className="shortcut-space"></div>
                            <div><span>a</span><strong>ADD MODE</strong></div>
                            <div><span>h</span><strong>HISTORY</strong></div>
                        </div>
                        <button className="shortcut-ok" onClick={() => setShowShortcuts(false)}>Close</button>
                    </div>
                </div>
            )}
            {showHistory && (
                <div className="history-overlay">
                    <div className="history-popup">
                        <div className="history-header">
                            <h2>Calculation History</h2>
                            <button className="history-close" onClick={() => setShowHistory(false)}>×</button>
                        </div>
                        {history.length === 0 ? (
                            <div className="history-empty">
                                <div className="history-empty-icon">🧮</div>
                                <p>No calculations yet.</p>
                                <span>Your calculation history will appear here.</span>
                            </div>
                        ) : (
                            <>
                                <div className="history-list">
                                    {history.map((item) => (
                                        <button key={item.id} className="history-item" onClick={() => useHistoryResult(item.result)}>
                                            <div className="history-calculation">{item.expression}</div>
                                            <div className="history-result">= {item.result}</div>
                                            <div className="history-date">{item.date}</div>
                                        </button>
                                    ))}
                                </div>
                                <button className="history-clear" onClick={clearHistory}>Clear History</button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

export default Calculator;