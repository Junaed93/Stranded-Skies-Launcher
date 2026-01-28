# Build Stage
FROM gradle:jdk25 AS build
WORKDIR /app
COPY . .
RUN gradle build -x test --no-daemon

# Run Stage
FROM openjdk:25-jdk
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

# Create directory for H2 database
RUN mkdir -p /app/data

# Environment variables
ENV PORT=8080
ENV DB_URL=jdbc:h2:file:./data/game;DB_CLOSE_DELAY=-1;AUTO_RECONNECT=TRUE

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
