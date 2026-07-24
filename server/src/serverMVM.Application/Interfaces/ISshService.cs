using serverMVM.Application.DTOs;

namespace serverMVM.Application.Interfaces;

public interface ISshService
{
    (bool IsSuccess, string Message) TestConnection(SshConnectionRequestDto request);
    VpsSystemInfoResponseDto GetSystemInfo(SshConnectionRequestDto request);
}
