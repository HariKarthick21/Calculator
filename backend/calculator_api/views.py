import math
import ast
import operator
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(["POST"])
def calculate(request):
    first_number = request.data.get("first_number")
    operation = request.data.get("operation")
    second_number = request.data.get("second_number")
    if first_number is None:
        return Response({"error": "first_number is required."}, status=400)
    if operation is None:
        return Response({"error": "operation is required."}, status=400)
    try:
        first_number = float(first_number)
        if second_number is not None:
            second_number = float(second_number)
    except (ValueError, TypeError):
        return Response({"error": "Numbers must be valid numeric values."}, status=400)
    if operation == "add":
        if second_number is None:
            return Response({"error": "second_number is required."}, status=400)
        result = first_number + second_number
    elif operation == "subtract":
        if second_number is None:
            return Response({"error": "second_number is required."}, status=400)
        result = first_number - second_number
    elif operation == "multiply":
        if second_number is None:
            return Response({"error": "second_number is required."}, status=400)
        result = first_number * second_number
    elif operation == "divide":
        if second_number is None:
            return Response({"error": "second_number is required."}, status=400)
        if second_number == 0:
            return Response({"error": "Cannot divide by zero."}, status=400)
        result = first_number / second_number
    elif operation == "percentage":
        result = first_number / 100
    elif operation == "reciprocal":
        if first_number == 0:
            return Response({"error": "Cannot calculate reciprocal of zero."}, status=400)
        result = 1 / first_number
    elif operation == "square":
        result = first_number ** 2
    elif operation == "cube":
        result = first_number ** 3
    elif operation == "sqrt":
        if first_number < 0:
            return Response({"error": "Cannot calculate square root of a negative number."}, status=400)
        result = math.sqrt(first_number)
    elif operation == "cbrt":
        result = math.cbrt(first_number)
    else:
        return Response({"error": "Invalid operation."}, status=400)
    return Response({
        "first_number": first_number,
        "operation": operation,
        "second_number": second_number,
        "result": result
    })

def evaluate_expression(expression):
    operators = {
        ast.Add: operator.add,
        ast.Sub: operator.sub,
        ast.Mult: operator.mul,
        ast.Div: operator.truediv,
        ast.Pow: operator.pow
    }
    def evaluate(node):
        if isinstance(node, ast.Constant):
            if isinstance(node.value, (int, float)):
                return node.value
            raise ValueError("Invalid number.")
        if isinstance(node, ast.BinOp):
            left = evaluate(node.left)
            right = evaluate(node.right)
            operation = operators.get(type(node.op))
            if operation is None:
                raise ValueError("Invalid operator.")
            if isinstance(node.op, ast.Div) and right == 0:
                raise ZeroDivisionError("Cannot divide by zero.")
            if isinstance(node.op, ast.Pow) and abs(right) > 100:
                raise ValueError("Exponent is too large.")
            return operation(left, right)
        if isinstance(node, ast.UnaryOp):
            if isinstance(node.op, ast.USub):
                return -evaluate(node.operand)
            if isinstance(node.op, ast.UAdd):
                return evaluate(node.operand)
            raise ValueError("Invalid unary operator.")
        raise ValueError("Invalid expression.")
    try:
        tree = ast.parse(expression, mode="eval")
    except SyntaxError:
        raise ValueError("Invalid expression.")
    return evaluate(tree.body)

@api_view(["POST"])
def calculate_expression(request):
    expression = request.data.get("expression")
    if not expression:
        return Response({"error": "Expression is required."}, status=400)
    if not isinstance(expression, str):
        return Response({"error": "Expression must be a string."}, status=400)
    expression = expression.strip()
    if not expression:
        return Response({"error": "Expression is required."}, status=400)
    try:
        result = evaluate_expression(expression)
        return Response({
            "expression": expression,
            "result": result
        })
    except ZeroDivisionError as error:
        return Response({"error": str(error)}, status=400)
    except ValueError as error:
        return Response({"error": str(error)}, status=400)
    except Exception:
        return Response({"error": "Invalid expression."}, status=400)

@api_view(["POST"])
def add_operation(request):
    number = request.data.get("number")
    operation = request.data.get("operation")
    angle_mode = request.data.get("angle_mode", "DEG")
    if number is None:
        return Response({"error": "number is required."}, status=400)
    try:
        number = float(number)
    except (ValueError, TypeError):
        return Response({"error": "Number must be a valid numeric value."}, status=400)
    if operation is None:
        return Response({"error": "operation is required."}, status=400)
    if operation == "sin":
        value = number
        if angle_mode == "DEG":
            value = math.radians(value)
        result = math.sin(value)
    elif operation == "cos":
        value = number
        if angle_mode == "DEG":
            value = math.radians(value)
        result = math.cos(value)
    elif operation == "tan":
        value = number
        if angle_mode == "DEG":
            value = math.radians(value)
        result = math.tan(value)
    elif operation == "log":
        if number <= 0:
            return Response({"error": "Logarithm is only defined for positive numbers."}, status=400)
        result = math.log10(number)
    elif operation == "pi":
        result = math.pi
    elif operation == "exp":
        try:
            result = math.exp(number)
        except OverflowError:
            return Response({"error": "Number is too large."}, status=400)
    elif operation == "abs":
        result = abs(number)
    elif operation == "factorial":
        if number < 0:
            return Response({"error": "Factorial is not defined for negative numbers."}, status=400)
        if not number.is_integer():
            return Response({"error": "Factorial requires a whole number."}, status=400)
        if number > 1000:
            return Response({"error": "Number is too large for factorial."}, status=400)
        result = math.factorial(int(number))
    elif operation == "dec":
        result = number
    elif operation == "bin":
        if not number.is_integer():
            return Response({"error": "Binary conversion requires a whole number."}, status=400)
        result = bin(int(number))
    elif operation == "oct":
        if not number.is_integer():
            return Response({"error": "Octal conversion requires a whole number."}, status=400)
        result = oct(int(number))
    elif operation == "hex":
        if not number.is_integer():
            return Response({"error": "Hexadecimal conversion requires a whole number."}, status=400)
        result = hex(int(number))
    else:
        return Response({"error": "Invalid ADD operation."}, status=400)
    return Response({
        "number": number,
        "operation": operation,
        "angle_mode": angle_mode,
        "result": result
    })