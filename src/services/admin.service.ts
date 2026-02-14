// Lista de User IDs que são administradores
// Adicione aqui os Firebase Auth UIDs dos admins
const ADMIN_USER_IDS: string[] = [
    'KxcfjVsIXwZL6HNzJdaLkjGhoz12', // Lucas - Admin
];
/**
 * Verifica se um usuário é administrador
 */
export function isAdmin(userId: string | undefined | null): boolean {
    if (!userId) return false
    return ADMIN_USER_IDS.includes(userId)
}

/**
 * Adiciona um novo admin à lista (use com cuidado!)
 */
export function addAdmin(userId: string): void {
    if (!ADMIN_USER_IDS.includes(userId)) {
        ADMIN_USER_IDS.push(userId)
        console.log('✅ Admin adicionado:', userId)
    }
}

/**
 * Remove um admin da lista
 */
export function removeAdmin(userId: string): void {
    const index = ADMIN_USER_IDS.indexOf(userId)
    if (index > -1) {
        ADMIN_USER_IDS.splice(index, 1)
        console.log('❌ Admin removido:', userId)
    }
}

/**
 * Lista todos os admins
 */
export function getAdmins(): string[] {
    return [...ADMIN_USER_IDS]
}
