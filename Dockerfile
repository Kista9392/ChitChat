# Multi-stage build for Spring Boot Backend on Hugging Face Spaces
FROM maven:3.8.5-openjdk-17 AS build
WORKDIR /app

# Copy the pom.xml and source code from the backend subdirectory
COPY backend/pom.xml ./
COPY backend/src ./src

# Build the application
RUN mvn clean package -DskipTests

# Run stage
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Hugging Face Spaces requires running on port 7860
EXPOSE 7860
ENV PORT=7860

# Add lightweight garbage collection flags to keep it clean and optimized
ENTRYPOINT ["java", "-XX:+UseSerialGC", "-Xms64m", "-Xmx512m", "-Dserver.port=7860", "-jar", "app.jar"]
