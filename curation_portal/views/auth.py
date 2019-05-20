from django.shortcuts import redirect
from django.views import View


class SigninView(View):
    def get(self, request):
        return redirect("assignments")
