function Button({children,onClick,className=""}){
    return(
        <button className={`calculator-button ${className}`} onClick={onClick}>
            {children}
        </button>
    );
}
export default Button;