using Microsoft.AspNetCore.Mvc;
using AkýllýTrafikSistemi.Models;
using System.Security.Cryptography;
using System.Text;

namespace AkýllýTrafikSistemi.Controllers
{
    public class AuthController : Controller
    {
        private readonly IUserRepository _userRepository;

        public AuthController(IUserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public IActionResult Register() => View();

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Register(User user)
        {
            if (ModelState.IsValid)
            {
                if (await _userRepository.UsernameExistsAsync(user.Username))
                {
                    ModelState.AddModelError("Username", "Bu kullanýcý adý zaten kullanýlýyor");
                    return View(user);
                }

                if (await _userRepository.EmailExistsAsync(user.Email))
                {
                    ModelState.AddModelError("Email", "Bu email zaten kayýtlý");
                    return View(user);
                }

                user.PasswordHash = HashPassword(user.Password);

                if (await _userRepository.CreateUserAsync(user))
                {
                    TempData["SuccessMessage"] = "Kayýt baþarýlý! Giriþ yapabilirsiniz.";
                    return RedirectToAction("Login");
                }
                ModelState.AddModelError("", "Kayýt sýrasýnda bir hata oluþtu");
            }
            return View(user);
        }

        public IActionResult Login() => View();

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Login(LoginModel loginModel)
        {
            if (ModelState.IsValid)
            {
                var user = await _userRepository.GetUserByEmailAsync(loginModel.Email);
                if (user != null && VerifyPassword(loginModel.Password, user.PasswordHash))
                {
                    HttpContext.Session.SetString("UserId", user.Id.ToString());
                    HttpContext.Session.SetString("Username", user.Username);
                    return RedirectToAction("Index", "Home");
                }
                ModelState.AddModelError("", "Email veya þifre hatalý");
            }
            return View(loginModel);
        }

        public IActionResult ChangePassword() => View();

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> ChangePassword(ChangePasswordModel model)
        {
            if (ModelState.IsValid)
            {
                var user = await _userRepository.GetUserByUsernameAndEmailAsync(model.Username, model.Email);
                if (user != null)
                {
                    var newPasswordHash = HashPassword(model.NewPassword);
                    if (await _userRepository.UpdatePasswordAsync(model.Email, newPasswordHash))
                    {
                        TempData["SuccessMessage"] = "Þifreniz deðiþtirildi.";
                        return RedirectToAction("Login");
                    }
                }
                ModelState.AddModelError("", "Bilgiler eþleþmiyor.");
            }
            return View(model);
        }

        public IActionResult Logout()
        {
            HttpContext.Session.Clear();
            return RedirectToAction("Login");
        }

        private static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }

        private static bool VerifyPassword(string password, string passwordHash) => HashPassword(password) == passwordHash;
    }
}