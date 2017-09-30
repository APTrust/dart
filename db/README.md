# Loading Demo Data

Delete the existing database, if you want to start fresh:

`rm easy-store.db`

Generate a new, empty database:

```
cd apps/apt_db_migrate
go build
./apt_db_migrate
```

Change into the easy-store root directory.

`cd ../../`

Load the data:

`sqlite3 easy-store.db < db/demo_data.sql`
