# Multi-stage build for Spring Boot Backend on Hugging Face Spaces
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

# Hugging Face Spaces requires port 7860
EXPOSE 7860

# Optimized JVM flags for low-memory container environment
ENTRYPOINT ["java", \
  "-XX:+UseSerialGC", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Xms64m", \
  "-Xmx450m", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dserver.port=7860", \
  "-jar", "app.jar"]
