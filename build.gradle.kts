plugins {
    base
}

val npm = if (System.getProperty("os.name").lowercase().contains("windows")) "npm.cmd" else "npm"

tasks.register<Exec>("frontendInstall") {
    group = "build"
    description = "Installs frontend dependencies from package-lock.json."
    workingDir("frontend")
    commandLine(npm, "ci")
}

tasks.register<Exec>("frontendBuild") {
    group = "build"
    description = "Builds the React frontend."
    dependsOn("frontendInstall")
    workingDir("frontend")
    commandLine(npm, "run", "build")
}

tasks.named("build") {
    dependsOn(":backend:build", "frontendBuild")
}

tasks.register("bootRun") {
    group = "application"
    description = "Runs the Spring Boot backend."
    dependsOn(":backend:bootRun")
}
