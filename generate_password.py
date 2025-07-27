import hashlib
import secrets
import base64

def make_django_password(password):
    """
    Genera un hash de contraseña compatible con Django usando pbkdf2_sha256
    """
    # Generar salt aleatorio
    salt = secrets.token_urlsafe(12)
    
    # Configuración de Django por defecto
    iterations = 600000
    algorithm = 'pbkdf2_sha256'
    
    # Generar hash usando pbkdf2
    hash_obj = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        iterations
    )
    
    # Codificar en base64
    hash_b64 = base64.b64encode(hash_obj).decode('ascii')
    
    # Formato Django: algorithm$iterations$salt$hash
    django_hash = f"{algorithm}${iterations}${salt}${hash_b64}"
    
    return django_hash

# Generar hash para la contraseña
password = "bracKleciRew"
hash_password = make_django_password(password)

print(f"Contraseña: {password}")
print(f"Hash Django: {hash_password}")
print()
print("=== COMANDO SQL PARA DBEAVER ===")
print(f"""
-- Eliminar usuario existente (si existe)
DELETE FROM auth_user WHERE username = 'admin';

-- Crear superusuario con hash correcto
INSERT INTO auth_user (
    username, 
    first_name, 
    last_name, 
    email, 
    password, 
    is_staff, 
    is_active, 
    is_superuser, 
    date_joined
) VALUES (
    'admin',
    'Super',
    'Admin',
    'admin@safevg.com',
    '{hash_password}',
    true,
    true,
    true,
    NOW()
);

-- Verificar que se creó
SELECT username, email, is_superuser, is_staff, is_active 
FROM auth_user 
WHERE username = 'admin';
""")
