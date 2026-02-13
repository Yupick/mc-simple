/**
 * Manejo de autenticación
 */

function loginHandler() {
    return {
        username: '',
        password: '',
        loading: false,
        error: '',

        async submit() {
            this.loading = true;
            this.error = '';

            try {
                await api.login(this.username, this.password);
                // Redirigir al dashboard
                window.location.href = '/';
            } catch (error) {
                this.error = error.message || 'Error al iniciar sesión';
            } finally {
                this.loading = false;
            }
        }
    };
}

async function logout() {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
        try {
            await api.logout();
            window.location.href = '/login';
        } catch (error) {
            console.error('Error al cerrar sesión:', error);
        }
    }
}

// Verificar autenticación en páginas protegidas
async function checkAuth() {
    try {
        const user = await api.getCurrentUser();
        return user;
    } catch (error) {
        // Redirigir a login si no está autenticado
        if (window.location.pathname !== '/login') {
            window.location.href = '/login';
        }
        return null;
    }
}
