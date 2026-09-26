# syntax=docker/dockerfile:1

# Build stage: needs the full SDK, which the runtime image does not ship.
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS build
WORKDIR /src

# Restore before copying the sources. This layer is cached until backend.csproj
# itself changes, so editing a .cs file does not re-download every package.
COPY backend.csproj .
RUN dotnet restore

COPY . .
RUN dotnet publish -c Release -o /app --no-restore

# Runtime stage: the ASP.NET image, which carries the runtime but no compiler,
# so the shipped image contains no build tooling and no source.
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS final
WORKDIR /app

# Npgsql probes for Kerberos auth on connect. Alpine does not ship the library,
# so without this every startup logs a failure to load libgssapi_krb5.so.2. The
# connection succeeds either way, but an error line that is not an error is
# worse than the 2MB.
RUN apk add --no-cache krb5-libs

COPY --from=build /app .

# Runs as the non-root account the base image defines. A process that does not
# need to write anywhere should not be able to.
USER $APP_UID

# 8080, not 80: the default for .NET images since they stopped running as root,
# because binding a port below 1024 needs privileges this user does not have.
EXPOSE 8080

ENTRYPOINT ["dotnet", "backend.dll"]
