using serverMVM.Application.DTOs;

namespace serverMVM.Application.Interfaces;

public interface ILinuxSystemInfoParser
{
    VpsSystemInfoResponseDto Parse(string rawCommandOutput);
}
