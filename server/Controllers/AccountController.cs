using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using BarberShopTemplate.Models;
using BarberShopTemplate.ViewModels;
using BarberShopTemplate.Services;
using BarberShopTemplate.Repositories;
using BarberShopTemplate.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System.Collections.Concurrent;
using BarberShopTemplate.DTO;
using System.Runtime.CompilerServices;
using System.Text.RegularExpressions;

[Route("api/[controller]")]
[ApiController]
public class AccountController : ControllerBase
{
    private readonly UserManager<AppUser> _userManager;
    private readonly SignInManager<AppUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly EmailService _emailService;
    private readonly JwtService _jwtService;
    private readonly MessageService _messageService;
    private readonly IVerificationCodeRepository _verificationCodeRepository;
    private readonly RoleManager<IdentityRole> _roleManager;
    private readonly ILogger<AccountController> _logger;
    private readonly IUserActivityRepository _userActivityRepository;
    private static readonly ConcurrentDictionary<string, DateTime> _verificationEmailTimestamps = new ConcurrentDictionary<string, DateTime>();
    private static readonly ConcurrentDictionary<string, DateTime> _verificationPhoneTimestamps = new ConcurrentDictionary<string, DateTime>();
    private static readonly ConcurrentDictionary<string, DateTime> _resetPasswordTimestamps = new ConcurrentDictionary<string, DateTime>();
    private readonly ToggleSmsService _toggleSmsService;


    public AccountController(
         UserManager<AppUser> userManager,
         SignInManager<AppUser> signInManager,
         IConfiguration configuration,
         EmailService emailService,
         JwtService jwtService,
         MessageService messageService,
         IVerificationCodeRepository verificationCodeRepository,
         RoleManager<IdentityRole> roleManager,
         ILogger<AccountController> logger,
         IUserActivityRepository userActivityRepository,
         ToggleSmsService toggleSmsService
        )
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _emailService = emailService;
        _jwtService = jwtService;
        _messageService = messageService;
        _verificationCodeRepository = verificationCodeRepository;
        _roleManager = roleManager;
        _logger = logger;
        _userActivityRepository = userActivityRepository;
        _toggleSmsService = toggleSmsService;
    }


    // Registers a new user 
    [HttpPost("Register")]
    public async Task<IActionResult> Register(RegisterViewModel model)
    {
        if (ModelState.IsValid)
        {
            var user = new AppUser
            {
                UserName = model.Username,
                Email = model.Email,
                PhoneNumber = model.PhoneNumber
            };

            if (user.PhoneNumber.StartsWith("0"))
            {
                user.PhoneNumber = "+44" + user.PhoneNumber.Substring(1);
            }
            else if (user.PhoneNumber.StartsWith("44"))
            {
                user.PhoneNumber = "+" + user.PhoneNumber;
            }
            else if (user.PhoneNumber.StartsWith("+44"))
            {
                // Do nothing
            }
            else
            {
                return BadRequest(new { Errors = new Dictionary<string, string> { { "phoneNumber", "Invalid phone number format" } } });
            }

            var validationErrors = new Dictionary<string, string>();

            // Check if a user already has this username
            var existingUser3 = await _userManager.Users.SingleOrDefaultAsync(u => u.UserName == user.UserName);
            if (existingUser3 != null)
            {
                validationErrors["username"] = "Username already exists";
            }

            // Regular expression for validating email format
            var emailRegex = new Regex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$");

            if (!emailRegex.IsMatch(user.Email))
            {
                validationErrors["email"] = "Invalid email format";
            }
            else
            {
                // Check if a user already has this email
                var existingUser2 = await _userManager.Users.SingleOrDefaultAsync(u => u.Email == user.Email);
                if (existingUser2 != null)
                {
                    validationErrors["email"] = "Email already in use";
                }
            }

            // Check if a user already has this phone number
            var existingUser = await _userManager.Users.SingleOrDefaultAsync(u => u.PhoneNumber == user.PhoneNumber);
            if (existingUser != null)
            {
                validationErrors["phoneNumber"] = "Phone number already in use";
            }

            if (validationErrors.Any())
            {
                return BadRequest(new { Errors = validationErrors });
            }

          
            var result = await _userManager.CreateAsync(user, model.Password);

            if (result.Succeeded)
            {
                try
                {
                    bool isSmsEnabled = _toggleSmsService.GetStatus();
                    if (isSmsEnabled) {
                        var code = GenerateVerificationCode();
                        var verificationCode = new VerificationCode
                        {
                            Code = code,
                            AppUserId = user.Id,
                            expires = DateTime.UtcNow.AddMinutes(75)
                        };

                        await _verificationCodeRepository.Add(verificationCode);
                        await _messageService.SendRegistrationMessage(user.PhoneNumber, code);
                    }
                }
                catch
                {
                    // Pass
                }

                // Generate email verification token and send verification email
                var emailToken = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var frontendBaseUrl = _configuration["Frontend:BaseUrl"];
                var verificationLink = $"{frontendBaseUrl}/verify-email?X7dxcsafs={user.Id}&7NSmdnsid={Uri.EscapeDataString(emailToken)}";
                var emailMessage = $"Please verify your email by clicking on the link: {verificationLink}";
                await _emailService.SendEmailAsync(user.Email, "Email Verification", emailMessage);

                var newActivity = new UserActivityDto
                {
                    Message = $"{user.UserName} has created an account",
                    Date = DateTime.Now,
                    MessageType = "Account Creation",
                    UserType = "User"
                };

                await _userActivityRepository.AddUserActivity(newActivity);

                return Ok(new { Message = $"User registered successfully. Please check your email to verify your account. Text sent to {user.PhoneNumber}." });

            }
            else
            {
                foreach (var error in result.Errors)
                {
                    var errorKey = error.Code.Contains("Password") ? "password" : "general";
                    if (!validationErrors.ContainsKey(errorKey))
                    {
                        validationErrors[errorKey] = error.Description;
                    }
                }
                return BadRequest(new { Errors = validationErrors });
            }
        }

        return BadRequest(ModelState);
    }

    
    // Verifies a user's number with a mobile authentication code
    [HttpGet("VerifyPhone")]
    public async Task<IActionResult> VerifyPhone(string userId, string code)
    {
        if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(code))
        {
            return BadRequest(new { message = "User ID and code are required" });
        }

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return NotFound(new { message = "User not found" });
        }

        var verificationCode = await _verificationCodeRepository.GetValidVerificationCodeByUserIdAsync(userId);
        if (verificationCode == null)
        {
            return BadRequest(new { message = "Invalid or expired verification code" });
        }

        if (verificationCode.Code != code)
        {
            return BadRequest(new { message = "Verification code is incorrect" });
        }

        user.PhoneNumberConfirmed = true;
        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
        {
            return StatusCode(500, new { message = "Failed to verify phone number" });
        }

        await _verificationCodeRepository.DeleteVerificationCodeAsync(userId);

        return Ok(new { message = "Phone number verified successfully" });
    }


    // Sends the user a new verification code 
    [HttpPost("GetNewVerificationCode")]
    public async Task<IActionResult> GetNewVerificationCode(string userId)
    {
        bool isSmsEnabled = _toggleSmsService.GetStatus();
        if (isSmsEnabled)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { message = "User ID is required" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            if (_verificationPhoneTimestamps.TryGetValue(userId, out var lastSent))
            {
                if (DateTime.UtcNow < lastSent.AddMinutes(10))
                {
                    return BadRequest(new { message = "You can only send a verification code every 10 minutes" });
                }
            }

            var newCode = GenerateVerificationCode();
            var newExpiry = DateTime.UtcNow.AddMinutes(75);

            try
            {
                await _verificationCodeRepository.UpdateVerificationCodeAsync(userId, newCode, newExpiry);
                await _messageService.SendRegistrationMessage(user.PhoneNumber, newCode);
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("\"code\": \"20012\""))
                {
                    return BadRequest(new { Message = "SMS is currently unavailable" });
                }
                _logger.LogError(ex, "Failed to send new verification SMS");
                return StatusCode(500, new { message = $"Failed to send new verification SMS: {ex.Message}" });
            }

            _verificationPhoneTimestamps[userId] = DateTime.UtcNow;
            CleanupOldPhoneEntries();

            return Ok(new { message = "A new verification code has been sent" });
        }
        else 
        {
            return BadRequest(new { Message = "SMS has currently been disabled" }); 
        }
    }


    // Admin can request as many codes as needed without having to wait 10 minutes
    [Authorize(Roles = "Admin")]
    [HttpPost("AdminGetNewVerificationCode")]
    public async Task<IActionResult> GetNewVerificationCodeAdmin(string userId)
    {
        bool isSmsEnabled = _toggleSmsService.GetStatus();
        if (isSmsEnabled)
        {
            if (string.IsNullOrEmpty(userId))
            {
                return BadRequest(new { message = "User ID is required" });
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return NotFound(new { message = "User not found" });
            }

            var newCode = GenerateVerificationCode();
            var newExpiry = DateTime.UtcNow.AddMinutes(75);

            try
            {
                await _verificationCodeRepository.UpdateVerificationCodeAsync(userId, newCode, newExpiry);
                await _messageService.SendRegistrationMessage(user.PhoneNumber, newCode);
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("\"code\": \"20012\""))
                {
                    return BadRequest(new { Message = "SMS is currently unavailable" });
                }
                _logger.LogError(ex, "Failed to send new verification SMS");
                return StatusCode(500, new { message = $"Failed to send new verification SMS: {ex.Message}" });
            }


            CleanupOldPhoneEntries();

            return Ok(new { message = "A new verification code has been sent" });
        }
        else 
        { 
            return BadRequest(new { Message = "SMS has currently been disabled" }); 
        }
    }

    private void CleanupOldPhoneEntries()
    {
        var threshold = DateTime.UtcNow.AddMinutes(-10); 
        foreach (var entry in _verificationPhoneTimestamps)
        {
            if (entry.Value < threshold)
            {
                _verificationPhoneTimestamps.TryRemove(entry.Key, out _);
            }
        }
    }

    
    // Verifies a email once clicked on the link within email
    [HttpGet("VerifyEmail")]
    public async Task<IActionResult> VerifyEmail(string userId, string token)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return BadRequest(new { message = "Invalid user ID" });
            }

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (result.Succeeded)
            {
                return Ok(new { message = "Email verified successfully!" });
            }
            else
            {
                return BadRequest(new { message = "Error verifying email" });
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while verifying email for user ID {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while verifying email" });
        }
    }

    // Sends the user a new email verification link
    [HttpPost("ResendVerificationEmail")]
    public async Task<IActionResult> ResendVerificationEmail(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return BadRequest(new { message = "Invalid user ID." });
        }

        if (user.EmailConfirmed)
        {
            return BadRequest(new { message = "Email is already confirmed." });
        }

        if (_verificationEmailTimestamps.TryGetValue(userId, out var lastSent))
        {
            if (DateTime.UtcNow < lastSent.AddMinutes(10))
            {
                return BadRequest(new { message = "You can only send a verification email every 10 minutes. Please try again later." });
            }
        }

        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var frontendBaseUrl = _configuration["Frontend:BaseUrl"];
        var verificationLink = $"{frontendBaseUrl}/verify-email?X7dxcsafs={user.Id}&7NSmdnsid={Uri.EscapeDataString(token)}";
        var message = $"Please verify your email by clicking on the link: {verificationLink}";

        try
        {
            await _emailService.SendEmailAsync(user.Email, "Email Verification", message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email");
            return StatusCode(500, new { message = "An error occurred while sending the verification email" });
        }

        _verificationEmailTimestamps[userId] = DateTime.UtcNow;
        CleanupOldEmailEntries();

        return Ok(new { message = "Verification email has been resent." });
    }

    // Admin can request as many emails as needed without having to wait 10 minutes 
    [Authorize(Roles = "Admin")]
    [HttpPost("AdminResendVerificationEmail")]
    public async Task<IActionResult> ResendVerificationEmailAdmin(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            return BadRequest(new { message = "Invalid user ID." });
        }

        if (user.EmailConfirmed)
        {
            return BadRequest(new { message = "Email is already confirmed." });
        }


        var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
        var frontendBaseUrl = "https://localhost:7260";
        var verificationLink = $"{frontendBaseUrl}/verifyemail?X7dxcsafs={user.Id}&7NSmdnsid={Uri.EscapeDataString(token)}";
        var message = $"Please verify your email by clicking on the link: {verificationLink}";

        try
        {
            await _emailService.SendEmailAsync(user.Email, "Email Verification", message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send verification email");
            return StatusCode(500, new { message = "An error occurred while sending the verification email" });
        }

        CleanupOldEmailEntries();

        return Ok(new { message = "Verification email has been resent." });
    }

    private void CleanupOldEmailEntries()
    {
        var threshold = DateTime.UtcNow.AddMinutes(-10); 
        foreach (var entry in _verificationEmailTimestamps)
        {
            if (entry.Value < threshold)
            {
                _verificationEmailTimestamps.TryRemove(entry.Key, out _);
            }
        }
    }

    // Sends the user a password reset link
    [HttpPost("PasswordResetRequest")]
    public async Task<IActionResult> PasswordResetRequest(PasswordResetRequestViewModel model)
    {
        if (_resetPasswordTimestamps.TryGetValue(model.Email, out var lastSent))
        {
            if (DateTime.UtcNow < lastSent.AddMinutes(10))
            {
                return BadRequest(new { message = "You can only send a password reset email every 10 minutes" });
            }
        }

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
        {
            // Don't reveal that the user does not exist
            return Ok(new { Message = "A password reset email has been sent" });
        }

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var frontendBaseUrl = _configuration["Frontend:BaseUrl"];
        var resetLink = $"{frontendBaseUrl}/reset-password?jHyfnKF1k={user.Id}&lqYt57v={Uri.EscapeDataString(token)}";
        var message = $"You can reset your password by clicking on the link: {resetLink}";

        try
        {
            await _emailService.SendEmailAsync(user.Email, "Password Reset", message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email");
            return StatusCode(500, new { message = "An error occurred while sending the password reset email" });
        }

        _resetPasswordTimestamps[model.Email] = DateTime.UtcNow;
        CleanUpPasswordResets();

        return Ok(new { Message = "A password reset email has been sent" });
    }

    private void CleanUpPasswordResets()
    {
        var threshold = DateTime.UtcNow.AddMinutes(-10);
        foreach (var entry in _resetPasswordTimestamps)
        {
            if (entry.Value < threshold)
            {
                _resetPasswordTimestamps.TryRemove(entry.Key, out _);
            }
        }
    }

   
    // Reset a password - from a link in email
    [HttpPost("ResetPassword")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordViewModel model)
    {
        var user = await _userManager.FindByIdAsync(model.UserId);
        if (user == null)
        {
            return BadRequest(new { message = "Invalid user ID" });
        }

        var result = await _userManager.ResetPasswordAsync(user, model.Token, model.NewPassword);
        if (result.Succeeded)
        {
            return Ok(new { message = "Password has been reset successfully" });
        }

        var errors = result.Errors.Select(e => e.Description).ToList();
        return BadRequest(new { message = "Failed to reset password.", errors });
    }


    // Admin can reset passwords without needing a link
    [Authorize(Roles = "Admin")]
    [HttpPost("ResetCustomerPassword")]
    public async Task<IActionResult> ResetCustomerPassword(ResetCustomerPasswordViewModel model)
    {
        try
        {
            var user = await _userManager.FindByIdAsync(model.UserId);
            if (user == null)
            {
                return BadRequest(new { message = "Invalid user ID" });
            }

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var result = await _userManager.ResetPasswordAsync(user, token, model.NewPassword);

            if (result.Succeeded)
            {
                return Ok(new { message = "Password has been reset successfully" });
            }

            var errors = result.Errors.Select(e => e.Description).ToArray();
            return BadRequest(new { errors });
        }
        catch (Exception ex)
        {
             _logger.LogError(ex, "An error occurred while resetting the password.");
            return BadRequest(new { message = $"An error occurred while resetting the password: {ex.Message}" });
        }
    }

    // Logs an existing user into their account
    [HttpPost("Login")]
    public async Task<IActionResult> Login(LoginViewModel model)
    {
        if (ModelState.IsValid)
        {
            var result = await _signInManager.PasswordSignInAsync(model.Username, model.Password, isPersistent: false, lockoutOnFailure: false);

            if (result.Succeeded)
            {
                var appUser = await _userManager.FindByNameAsync(model.Username);
                var roles = await _userManager.GetRolesAsync(appUser);
                var token = _jwtService.GenerateJwtToken(appUser, roles);

                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,
                    SameSite = SameSiteMode.None,
                    Expires = DateTime.UtcNow.AddMinutes(30)
                };

                Response.Cookies.Append("jwt", token, cookieOptions);

                return Ok(new { Message = "Login successful" });
            }
            else
            {
                return Unauthorized(new { Message = "Invalid login attempt" });
            }
        }

        return BadRequest(ModelState);
    }

    // Refresh a token when it is close to expiring
    [HttpPost("RefreshToken")]
    public async Task<IActionResult> RefreshToken([FromBody] string userId)
    {
        var appUser = await _userManager.FindByIdAsync(userId);
        if (appUser == null) { return Ok(new { Message = "Invalid credentials" }); }

        var roles = await _userManager.GetRolesAsync(appUser);
        var token = _jwtService.GenerateJwtToken(appUser, roles);

        // Set the JWT token as a cookie
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = true,
            SameSite = SameSiteMode.None,
            Expires = DateTime.UtcNow.AddMinutes(30)
        };

        Response.Cookies.Append("jwt", token, cookieOptions);

        return Ok(new { Message = "Refresh successful" });
    }

    // Logs out a user
    [HttpPost("Logout")]
    public IActionResult Logout()
    {
        var cookieOptions = new CookieOptions
        {
            Expires = DateTime.UtcNow.AddDays(-1), 
            HttpOnly = true,
            Secure = true, 
            SameSite = SameSiteMode.None 
        };

        Response.Cookies.Append("jwt", "", cookieOptions);
        return Ok(new { Message = "Logout successful" });
    }

    // Validates the jwt token with the users assigned cookie
    [HttpPost("ValidateToken")]
    public IActionResult ValidateToken()
    {
        if (Request.Cookies.TryGetValue("jwt", out string token))
        {
            var (isValid, roles, userId, userName, expiryTime) = _jwtService.ValidateToken(token);

            if (isValid)
            {
                return Ok(new { Message = "Token is valid", Roles = roles, UserId = userId, UserName = userName,  expiryTime });
            }
            else
            {
                return Ok(new { Message = "Invalid token" });
            }
        }
        else
        {
            return Ok(new { Message = "Token is required" });
        }
    }

    // Updates a user roles
    [HttpPost("UpdateRole")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateRole(string userName, string role)
    {
        if (!await _roleManager.RoleExistsAsync(role))
        {
            return BadRequest(new { message = "Role does not exist" });
        }

        var user = await _userManager.FindByNameAsync(userName);

        if (user == null)
        {
            return BadRequest(new { message = "No user found" });
        }

        if (user.UserName == "admin")
        {
            return BadRequest(new { message = "Cannot update this account" });
        }

        if (await _userManager.IsInRoleAsync(user, role))
        {
            return BadRequest(new { message = "User is already in the specified role" });
        }

        var currentRoles = await _userManager.GetRolesAsync(user);
        if (currentRoles.Count > 0)
        {
            var removeResult = await _userManager.RemoveFromRolesAsync(user, currentRoles);
            if (!removeResult.Succeeded)
            {
                return StatusCode(StatusCodes.Status500InternalServerError, new { message = "Error removing user from current roles" });
            }
        }

        await _userManager.AddToRoleAsync(user, role);

        return Ok(new { message = "Updated role" });
    }

    // Helper function to generate mobile verification code
    private string GenerateVerificationCode()
    {
        var random = new Random();
        return random.Next(100000, 999999).ToString();
    }


}
