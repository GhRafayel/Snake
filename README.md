# ft_transcendence

### Create Next.js App  with typeScrip 
    * npx create-next-app@latest my-frontend --typescript
--------------------------------------------------
# Nest.js documentation : https://docs.nestjs.com/

### Create Nest.js App with typeScrip 
    * npm i -g @nestjs/cli
    * nest new  my-beckend

##  Create Module with Nest.js CLI
    * nest g module (name of module)
## Create Controller with Nest.js CLI
    * nest g controller (name of controller)
## Create Service with Nest.js CLI
    * nest g service (name of service)
#--------- Creating all in one command  --------------
    * nest g resource (name of resource) 


## For creating Partial Type for update method
    * npm i @nestjs/mapped-types -D 
        * -D for adding in devDependencies
## For validation of data transfer object (DTO)
    * npm i class-validator class-transformer 

## For using environment variables in Nest.js
    * npm i @nestjs/config
## For using Prisma as ORM in Nest.js
    * npm i prisma -D 
    * npx prisma init
## For creating migration and updating database with Prisma
    * npx prisma migrate dev --name init // for development 
    * npx prisma migrte deploy // for production
    * npx prisma migrate push  // for production without generating migration files
    * npx prisma generate // for generating Prisma client after updating schema.prisma file

    --------------------------------------------------------------
    #    # Example apdating database.                             #
    #    # After changing use this command with comment           #
    #                                                             #
    #  npx prisma migrate dev --nmae <coment whtat was changed>   #
    ---------------------------------------------------------------
## For creating module with Prisma in Nest.js
    * nest g module database 
--------------------------------------------------

### After git clone use for backend
    * npm install --prefix backend
### After git clone use for frontend
    * npm install --prefix frontend
## For using automatic useMemo and useCallback in React components
    * npm install babel-plugin-react-compiler@latest
## For instaling bcrypt 
    * npm install bcrypt 
    * npm install -D @types/bcrypt 
## For cookies and JWT authentication in Nest.js
    * npm i @nestjs/jwt @nestjs/passport passport passport-jwt cookie-parser
    * npm i -D @types/passport-jwt @types/cookie-parser
