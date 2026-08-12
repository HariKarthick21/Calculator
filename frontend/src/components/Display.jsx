function Display({ expression, value }) {
    return (
        <div className="calculator-display">
            <div className="expression">{expression}</div>
            <div className="display-value">{value}</div>
        </div>
    );
}
export default Display;