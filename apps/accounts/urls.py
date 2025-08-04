
# apps/accounts/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication
    path('register/client/', views.register_client, name='register_client'),
    path('register/admin/', views.register_admin, name='register_admin'),
    path('login/', views.login_user, name='login'),
    path('logout/', views.logout_user, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profile
    path('profile/', views.ProfileView.as_view(), name='profile'),
    
    # Admin Invitations
    path('invitations/', views.AdminInvitationListCreateView.as_view(), name='invitation_list'),
    path('invitations/<uuid:pk>/', views.AdminInvitationDetailView.as_view(), name='invitation_detail'),
    path('invitations/validate/<str:token>/', views.validate_invitation, name='validate_invitation'),
]
