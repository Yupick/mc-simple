# Guía de Configuración de Branch Protection Rules

## 📋 Configuración de Políticas de Protección de Ramas

### 🔒 Protección para `main` (Producción)

**URL:** https://github.com/Yupick/mc-simple/settings/branch_protection_rules/new

**Configuración:**

1. **Branch name pattern:** `main`

2. **Protect matching branches:**
   - ✅ **Require a pull request before merging**
     - ✅ Require approvals: `1`
     - ✅ Dismiss stale pull request approvals when new commits are pushed
     - ✅ Require review from Code Owners (si tienes CODEOWNERS)
   
   - ✅ **Require status checks to pass before merging**
     - ✅ Require branches to be up to date before merging
     - Agregar checks cuando tengas CI/CD configurado
   
   - ✅ **Require conversation resolution before merging**
   
   - ✅ **Require signed commits** (opcional, más seguro)
   
   - ✅ **Require linear history** (opcional, mantiene historial limpio)
   
   - ✅ **Include administrators** (las reglas aplican a todos)
   
   - ❌ **Allow force pushes** (NUNCA en main)
   
   - ❌ **Allow deletions** (NUNCA en main)

---

### 🔧 Protección para `develop` (Desarrollo)

**URL:** https://github.com/Yupick/mc-simple/settings/branch_protection_rules/new

**Configuración:**

1. **Branch name pattern:** `develop`

2. **Protect matching branches:**
   - ✅ **Require a pull request before merging**
     - ⚠️ Require approvals: `0` o `1` (según tamaño del equipo)
     - Opcional: Dismiss stale approvals
   
   - ⚠️ **Require status checks to pass before merging** (opcional)
     - Menos estricto que main
   
   - ✅ **Require conversation resolution before merging**
   
   - ❌ **Include administrators** (permite pushes directos para emergencias)
   
   - ❌ **Allow force pushes** (generalmente no recomendado)
   
   - ❌ **Allow deletions**

---

### 🌿 Protección para `feature/*`, `release/*`, `hotfix/*`

**Opcional - Reglas para ramas temporales:**

1. **Branch name pattern:** `feature/*` (crear 3 reglas separadas)
   - `feature/*`
   - `release/*`
   - `hotfix/*`

2. **Configuración mínima:**
   - ⚠️ Require a pull request before merging (opcional)
   - ✅ Allow deletions (necesario para limpiar después del merge)

---

## 🔍 Verificación

Una vez configuradas, las reglas se verán así en:
https://github.com/Yupick/mc-simple/settings/branches

```
Branch protection rules

main
  • Requires pull request reviews before merging
  • Requires approvals: 1
  • Requires status checks to pass before merging
  • Includes administrators

develop
  • Requires pull request reviews before merging
  • Requires conversation resolution before merging
```

---

## 📱 Configuración Alternativa via GitHub CLI

Si tienes GitHub CLI instalado (`gh`), puedes configurar vía comandos:

```bash
# Instalar gh (si no lo tienes)
# Ubuntu/Debian:
# curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
# echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
# sudo apt update && sudo apt install gh

# Login
gh auth login

# Proteger main
gh api repos/Yupick/mc-simple/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":[]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1}' \
  --field restrictions=null

# Proteger develop
gh api repos/Yupick/mc-simple/branches/develop/protection \
  --method PUT \
  --field required_status_checks='{"strict":false,"contexts":[]}' \
  --field enforce_admins=false \
  --field required_pull_request_reviews='{"required_approving_review_count":0}' \
  --field restrictions=null
```

---

## ✅ Checklist Final

Después de configurar:

- [ ] Main protegido con require PR + approvals
- [ ] Develop protegido con require PR
- [ ] Master eliminado del remoto
- [ ] Default branch = main
- [ ] Notificaciones de PR configuradas
- [ ] CODEOWNERS creado (opcional)
- [ ] CI/CD configurado (opcional, para status checks)

---

Generado: 2026-02-14
Proyecto: mc-simple
