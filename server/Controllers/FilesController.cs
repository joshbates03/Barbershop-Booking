// FilesController.cs
using Google.Cloud.Storage.V1;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;

namespace BarberShopTemplate.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class FilesController : ControllerBase
    {
        private readonly StorageClient _storageClient;
        private readonly string _bucketName = "barbershop-19606.appspot.com"; 
        private readonly ILogger<AppointmentsController> _logger;

        public FilesController(ILogger<AppointmentsController> logger)
        {
            _storageClient = FirebaseAdminHelper.GetStorageClient();
            _logger = logger;
        }

        [HttpGet("list")]
        public IActionResult ListFiles()
        {
            var files = new List<object>();
            try
            {
                var storageObjects = _storageClient.ListObjects(_bucketName);
                foreach (var storageObject in storageObjects)
                {
                    if (!storageObject.Name.Contains("/"))
                    {
                        var downloadUrl = $"https://firebasestorage.googleapis.com/v0/b/{_bucketName}/o/{Uri.EscapeDataString(storageObject.Name)}?alt=media";

                        files.Add(new
                        {
                            Name = storageObject.Name,
                            Size = storageObject.Size,
                            ContentType = storageObject.ContentType,
                            Updated = storageObject.Updated,
                            Url = downloadUrl
                        });
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to list files");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }

            return Ok(files);
        }


        [Authorize(Roles = "Admin, Barber")]
        [HttpPost("upload")]
        public async Task<IActionResult> UploadFile(IFormFile file)
        {
            if (file == null || file.Length == 0) { return BadRequest(new { message = "No file provided." }); }

            var allowedMimeTypes = new List<string> { "image/jpeg", "image/png", "image/gif", "image/bmp", "image/webp" };

            if (!allowedMimeTypes.Contains(file.ContentType)) { return BadRequest(new { message = "Only image files are allowed" }); }

            var objectName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
            try
            {
                using (var stream = file.OpenReadStream())
                {
                    await _storageClient.UploadObjectAsync(_bucketName, objectName, file.ContentType, stream);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to upload file");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }

            return Ok(new { message = "File uploaded successfully", fileName = objectName });
        }


        [Authorize(Roles = "Admin, Barber")]
        [HttpDelete("delete/{fileName}")]
        public async Task<IActionResult> DeleteFile(string fileName)
        {
            if (string.IsNullOrEmpty(fileName)) { return BadRequest(new { message = "Invalid file name" }); }

            try
            {
                await _storageClient.DeleteObjectAsync(_bucketName, fileName);
            }
            catch (Google.GoogleApiException ex) when (ex.Error.Code == 404)
            {
                return NotFound(new { message = "File not found" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to delete file");
                return StatusCode(500, new { message = "Internal server error", details = ex.Message });
            }

            return Ok(new { message = "File deleted successfully" });
        }

    }
}
