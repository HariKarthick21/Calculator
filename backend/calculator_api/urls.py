from django.urls import path
from .views import calculate, calculate_expression, add_operation

urlpatterns = [
    path("calculate/", calculate, name="calculate"),
    path("calculate-expression/",calculate_expression, name="calculate-expression"),
    path("add-operation/",add_operation,name="add-operation"),
]