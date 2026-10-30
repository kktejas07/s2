# Credential exposure — what happened and what to do

## Summary

Database credentials were committed to this repository, which is **public**.
They were present in `Web.config`, `Web_bkp.config` and `Web - Copy.config`,
and in a log4net appender that carried its own copy of the same connection
string.

They have been removed from the working tree. **That does not un-expose them.**
Git keeps every past version, and the repository is public, so the credentials
remain readable in history to anyone who clones it. Rotation is the only
remedy. Until each password below is changed, treat it as compromised.

At the time of writing the repository had **0 forks**, which limits how widely
the history has spread — but a public repository can be cloned without leaving
any trace, so absence of forks is not evidence that nobody took a copy.

## What was exposed

Five distinct credential pairs, across three config files:

| Account | Server | Databases |
|---|---|---|
| `IQEAppDBUser` | `13.68.226.43` | `IQE_PROD_DB`, `IQE_UAT_DB` |
| `IQEAppDBUser` | `20.121.48.206` | `IQEIMS_DEV` |
| `IQEAppDBUser` | `172.203.221.76` | `IQEIMS` |
| `IQEAppUser` | `edata.eastus.cloudapp.azure.com` | `webiqedb`, `webiqedb_DevTest` |
| `iqeadmin` | `iqe-db-server.database.windows.net` | `iqedevelopmentdb` |

`IQE_PROD_DB` is production. Rotate that one first.

Note that `IQEAppDBUser` uses the **same password across three different
servers**, so rotating one server does not protect the others — each needs its
own new, distinct password.

## 1. Rotate every password

For Azure SQL (`iqe-db-server.database.windows.net`):

```sql
-- Connect to the master database as an admin, then:
ALTER LOGIN [iqeadmin] WITH PASSWORD = '<new strong password>';
```

For the SQL Server instances on VMs (`13.68.226.43`, `20.121.48.206`,
`172.203.221.76`, `edata.eastus.cloudapp.azure.com`), on each server:

```sql
ALTER LOGIN [IQEAppDBUser] WITH PASSWORD = '<a different new password per server>';
-- and on the edata host:
ALTER LOGIN [IQEAppUser]   WITH PASSWORD = '<new strong password>';
```

Use a distinct password per account per server. Generate them with a password
manager, not by hand.

## 2. Put the new values where the app reads them

`Web.config` no longer contains credentials. It now reads them from
`connections.config`, which is in `.gitignore` and must never be committed:

```xml
<connectionStrings configSource="connections.config" />
```

On **each** environment (and each developer machine):

```bash
cp IQEApp.Web/connections.config.template IQEApp.Web/connections.config
# then edit connections.config and fill in that environment's real values
```

The application will not start until that file exists beside `Web.config`, so
deploy it as part of your release step. The log4net database appender now reads
the same named connection string rather than holding its own copy, so there is
exactly one place to update.

## 3. Check whether the exposed accounts were used

Rotation stops future access; it does not tell you whether anyone got in. In
the Azure portal, for each server, review sign-in and audit logs for the period
the credentials were public — from the first commit that contained them to
today — looking for connections from addresses you do not recognise.

If auditing was not enabled, enable it now. You cannot reconstruct the past,
but you will have it for next time.

## 4. Decide about rewriting history

The credentials are still in past commits. Removing them means rewriting
history and force-pushing, which **changes every commit hash** and breaks every
existing clone — anyone with a copy must re-clone. That is why it has not been
done for you.

If you decide to, with everyone's clones accounted for:

```bash
# install git-filter-repo first: pip install git-filter-repo
git clone --mirror https://github.com/kktejas07/iqe.git iqe-mirror
cd iqe-mirror

git filter-repo \
  --path 'IQEApp.Web/Web_bkp.config' \
  --path 'IQEApp.Web/Web_bkp.Debug.config' \
  --path 'IQEApp.Web/Web_bkp.Release.config' \
  --path 'IQEApp.Web/Web - Copy.config' \
  --invert-paths

# Web.config must stay, so scrub its contents rather than the file:
git filter-repo --replace-text ../replacements.txt

git push --force --mirror
```

where `replacements.txt` lists each exposed password, one per line, as
`<password>==>REMOVED`.

**Rewriting history is not a substitute for rotation.** Anyone who already
cloned the repository keeps their copy regardless. Rotate first; rewrite only
if you also want the values gone from the public record.

## 5. Keep it from recurring

- `.gitignore` now excludes `connections.config` and any `**/connections.config`.
- Consider enabling GitHub secret scanning and push protection on the
  repository (Settings → Code security and analysis). Push protection rejects a
  commit containing a recognised credential pattern before it reaches GitHub.
- Consider whether this repository needs to be public at all. If it does not,
  making it private is a single setting and reduces the blast radius of the
  next mistake — though, again, it does not retract what has already been
  published.
