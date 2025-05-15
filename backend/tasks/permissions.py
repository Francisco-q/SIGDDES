from rest_framework import permissions

class RoleBasedPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            user_role = request.user.userprofile.role
        except AttributeError:
            user_role = 'guest'

        if request.method in permissions.SAFE_METHODS:  # GET, HEAD, OPTIONS
            return user_role in ['admin', 'user', 'guest']
        else:  # POST, PUT, DELETE
            return user_role == 'admin'

    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False

        try:
            user_role = request.user.userprofile.role
        except AttributeError:
            user_role = 'guest'

        if request.method in permissions.SAFE_METHODS:
            return user_role in ['admin', 'user', 'guest']
        else:
            return user_role == 'admin'