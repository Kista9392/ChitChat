# Multi-stage build for Spring Boot Backend
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy pom.xml first for dependency caching
COPY backend/pom.xml ./pom.xml
# Download dependencies (cached layer unless pom.xml changes)
RUN mvn dependency:go-offline -B

# Copy source and build
COPY backend/src ./src
RUN mvn clean package -DskipTests -B

# Run stage - use slim JRE
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

COPY --from=build /app/target/*.jar app.jar

# Railway injects $PORT dynamically — expose it
EXPOSE 8080

# Optimized JVM flags for container environment
# PORT env var is injected by Railway at runtime
ENTRYPOINT ["java", \
  "-XX:+UseG1GC", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Xms128m", \
  "-Xmx512m", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
