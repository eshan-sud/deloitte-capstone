FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

WORKDIR /src

COPY aspnet-backend.csproj ./
RUN dotnet restore

COPY . .
RUN dotnet publish aspnet-backend.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /app

RUN apt-get update \
    && apt-get install -y curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "aspnet-backend.dll"]